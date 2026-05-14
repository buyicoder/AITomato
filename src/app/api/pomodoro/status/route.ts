import { prisma } from "@/lib/db";

const USER_ID = "default";

export async function GET() {
  const active = await prisma.pomodoroSession.findFirst({
    where: { userId: USER_ID, status: { in: ["RUNNING", "PAUSED"] } },
    include: { task: true },
  });

  if (!active) {
    return Response.json({ active: false });
  }

  const elapsedSeconds = Math.floor((Date.now() - active.startTime.getTime()) / 1000);
  const remainingSeconds = Math.max(0, active.duration * 60 - elapsedSeconds);

  return Response.json({
    active: true,
    sessionId: active.id,
    taskId: active.taskId,
    taskTitle: active.task?.title || "",
    type: active.type,
    duration: active.duration,
    remainingSeconds,
    status: active.status,
    startedAt: active.startTime,
  });
}
