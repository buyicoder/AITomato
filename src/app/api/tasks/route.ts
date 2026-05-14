import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";

const USER_ID = "default";

export async function GET() {
  const tasks = await prisma.task.findMany({
    where: { userId: USER_ID },
    orderBy: [{ status: "asc" }, { priority: "desc" }, { createdAt: "desc" }],
  });
  return Response.json(tasks);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const task = await prisma.task.create({
    data: {
      title: body.title || "未命名任务",
      description: body.description,
      priority: body.priority || "MEDIUM",
      estimatedPomodoros: body.estimatedPomodoros || 1,
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      userId: USER_ID,
    },
  });
  return Response.json(task, { status: 201 });
}
