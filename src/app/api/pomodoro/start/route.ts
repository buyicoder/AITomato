import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";

const USER_ID = "default";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const taskId = body.taskId;
  const duration = body.duration || 25;
  const type = body.type || "FOCUS";

  // Stop any active session
  await prisma.pomodoroSession.updateMany({
    where: { userId: USER_ID, status: { in: ["RUNNING", "PAUSED"] } },
    data: { status: "CANCELLED", endTime: new Date() },
  });

  // Update task status
  if (taskId) {
    await prisma.task.update({
      where: { id: taskId },
      data: { status: "IN_PROGRESS" },
    });
  }

  const session = await prisma.pomodoroSession.create({
    data: { taskId, duration, type, userId: USER_ID },
    include: { task: true },
  });

  return Response.json(session, { status: 201 });
}
