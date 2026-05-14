import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { chatCompletionStream } from "@/lib/ai";
import { buildSystemPrompt } from "@/lib/prompts";

const USER_ID = "default";

export async function POST(req: NextRequest) {
  const { message } = await req.json();
  if (!message) {
    return new Response(JSON.stringify({ error: "message required" }), { status: 400 });
  }

  // Ensure default user exists
  await prisma.user.upsert({
    where: { id: USER_ID },
    create: { id: USER_ID, name: "User" },
    update: {},
  });

  // Save user message
  await prisma.chatMessage.create({
    data: { role: "user", content: message, userId: USER_ID },
  });

  // Get recent chat history
  const recentMessages = await prisma.chatMessage.findMany({
    where: { userId: USER_ID },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  // Get current state
  const tasks = await prisma.task.findMany({ where: { userId: USER_ID } });
  const activeSession = await prisma.pomodoroSession.findFirst({
    where: { userId: USER_ID, status: { in: ["RUNNING", "PAUSED"] } },
    include: { task: true },
  });
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayPomodoros = await prisma.pomodoroSession.count({
    where: { userId: USER_ID, type: "FOCUS", status: "COMPLETED", startTime: { gte: todayStart } },
  });

  const systemPrompt = buildSystemPrompt({
    tasks: tasks.map((t) => ({
      id: t.id,
      title: t.title,
      status: t.status,
      priority: t.priority,
      estimatedPomodoros: t.estimatedPomodoros,
      completedPomodoros: t.completedPomodoros,
    })),
    activeTimer: activeSession?.task
      ? {
          taskTitle: activeSession.task.title,
          remainingMinutes: activeSession.duration - Math.floor((Date.now() - activeSession.startTime.getTime()) / 60000),
          type: activeSession.type,
        }
      : null,
    todayPomodoros,
  });

  const chatMessages = [
    { role: "system", content: systemPrompt },
    ...recentMessages.reverse().map((m) => ({ role: m.role, content: m.content })),
  ];

  const stream = await chatCompletionStream(chatMessages);

  const encoder = new TextEncoder();

  const readable = new ReadableStream({
    async start(controller) {
      let fullContent = "";

      try {
        for await (const chunk of stream) {
          const delta = chunk.choices?.[0]?.delta?.content;
          if (delta) {
            fullContent += delta;
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "text", content: delta })}\n\n`));
          }
        }

        // Parse action from the full response
        const actionMatch = fullContent.match(/<\|action\|>(.+?)<\|action\|>/);
        let action = null;
        let quickActions: string[] = [];

        if (actionMatch) {
          try {
            const parsed = JSON.parse(actionMatch[1]);
            action = parsed;
            quickActions = parsed.quickActions || [];

            // Execute the action and merge server-side data (e.g. sessionId)
            const serverData = await executeAction(parsed);
            if (serverData && Object.keys(serverData).length > 0) {
              parsed.data = { ...parsed.data, ...serverData };
              action = parsed;
            }
          } catch {
            // JSON parse failed, treat as plain chat
          }
        }

        // Save AI message
        const aiMessage = await prisma.chatMessage.create({
          data: {
            role: "assistant",
            content: fullContent.replace(/<\|action\|>.+?<\|action\|>/, "").trim(),
            metadata: JSON.stringify({ action, quickActions }),
            userId: USER_ID,
          },
        });

        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              type: "done",
              messageId: aiMessage.id,
              action,
              quickActions,
            })}\n\n`,
          ),
        );
        controller.close();
      } catch (error) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: "error", content: String(error) })}\n\n`),
        );
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

async function executeAction(action: { action: string; data: Record<string, unknown> }): Promise<Record<string, unknown> | undefined> {
  const { action: actionType, data } = action;

  switch (actionType) {
    case "create_task": {
      const task = await prisma.task.create({
        data: {
          title: String(data.title || "未命名任务"),
          description: data.description ? String(data.description) : null,
          priority: String(data.priority || "MEDIUM"),
          estimatedPomodoros: Number(data.estimatedPomodoros) || 1,
          dueDate: data.dueDate ? new Date(String(data.dueDate)) : null,
          userId: USER_ID,
        },
      });
      return { taskId: task.id };
    }
    case "update_task": {
      const id = String(data.id);
      const updateData: Record<string, unknown> = {};
      if (data.title) updateData.title = String(data.title);
      if (data.priority) updateData.priority = String(data.priority);
      if (data.estimatedPomodoros) updateData.estimatedPomodoros = Number(data.estimatedPomodoros);
      if (data.status) updateData.status = String(data.status);
      await prisma.task.update({ where: { id }, data: updateData });
      break;
    }
    case "complete_task": {
      await prisma.task.update({
        where: { id: String(data.id) },
        data: { status: "DONE" },
      });
      break;
    }
    case "start_pomodoro": {
      const taskId = String(data.taskId);
      const task = await prisma.task.findUnique({ where: { id: taskId } });
      if (!task) break;

      // Stop any existing active session first
      await prisma.pomodoroSession.updateMany({
        where: { userId: USER_ID, status: { in: ["RUNNING", "PAUSED"] } },
        data: { status: "CANCELLED", endTime: new Date() },
      });

      await prisma.task.update({
        where: { id: taskId },
        data: { status: "IN_PROGRESS" },
      });
      const session = await prisma.pomodoroSession.create({
        data: {
          taskId,
          duration: Number(data.duration) || 25,
          userId: USER_ID,
        },
      });
      return {
        sessionId: session.id,
        taskId,
        taskTitle: task.title,
        duration: Number(data.duration) || 25,
      };
    }
    case "stop_pomodoro": {
      const active = await prisma.pomodoroSession.findFirst({
        where: { userId: USER_ID, status: { in: ["RUNNING", "PAUSED"] } },
      });
      if (active) {
        await prisma.pomodoroSession.update({
          where: { id: active.id },
          data: { status: "COMPLETED", endTime: new Date() },
        });
        if (active.taskId) {
          await prisma.task.update({
            where: { id: active.taskId },
            data: { completedPomodoros: { increment: 1 } },
          });
        }
      }
      break;
    }
    case "get_insights":
    case "chat":
    default:
      break;
  }
  return undefined;
}
