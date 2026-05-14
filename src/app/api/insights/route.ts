import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";

const USER_ID = "default";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const days = parseInt(url.searchParams.get("days") || "1");

  const since = new Date();
  since.setDate(since.getDate() - days + 1);
  since.setHours(0, 0, 0, 0);

  const sessions = await prisma.pomodoroSession.findMany({
    where: {
      userId: USER_ID,
      status: "COMPLETED",
      startTime: { gte: since },
    },
    include: { task: true },
  });

  const focusSessions = sessions.filter((s) => s.type === "FOCUS");
  const totalMinutes = focusSessions.reduce((sum, s) => sum + s.duration, 0);

  const completedTasks = await prisma.task.count({
    where: { userId: USER_ID, status: "DONE", updatedAt: { gte: since } },
  });

  return Response.json({
    period: `${days}天`,
    completedPomodoros: focusSessions.length,
    focusMinutes: totalMinutes,
    completedTasks,
    sessions: sessions.map((s) => ({
      id: s.id,
      taskTitle: s.task?.title || "无任务",
      duration: s.duration,
      type: s.type,
      startTime: s.startTime,
    })),
  });
}
