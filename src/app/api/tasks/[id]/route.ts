import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const body = await req.json();
  const data: Record<string, unknown> = {};
  if (body.title !== undefined) data.title = body.title;
  if (body.description !== undefined) data.description = body.description;
  if (body.priority !== undefined) data.priority = body.priority;
  if (body.status !== undefined) data.status = body.status;
  if (body.estimatedPomodoros !== undefined) data.estimatedPomodoros = body.estimatedPomodoros;
  if (body.dueDate !== undefined) data.dueDate = new Date(body.dueDate);

  const task = await prisma.task.update({ where: { id }, data });
  return Response.json(task);
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  await prisma.task.delete({ where: { id } });
  return Response.json({ success: true });
}
