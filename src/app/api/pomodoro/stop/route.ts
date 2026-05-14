import { prisma } from "@/lib/db";

const USER_ID = "default";

export async function POST() {
  const active = await prisma.pomodoroSession.findFirst({
    where: { userId: USER_ID, status: { in: ["RUNNING", "PAUSED"] } },
  });

  if (!active) {
    return Response.json({ error: "No active session" }, { status: 400 });
  }

  const session = await prisma.pomodoroSession.update({
    where: { id: active.id },
    data: { status: "COMPLETED", endTime: new Date() },
  });

  if (active.taskId && active.type === "FOCUS") {
    await prisma.task.update({
      where: { id: active.taskId },
      data: { completedPomodoros: { increment: 1 } },
    });
  }

  return Response.json(session);
}
