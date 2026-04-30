import { Hono } from "hono";
import { eq, asc } from "drizzle-orm";
import { db } from "../db/index.js";
import { tasks } from "../db/schema.js";
import {
  createTaskSchema,
  updateTaskSchema,
  reorderTasksSchema,
} from "@simple-task-manager/shared";

export const taskRoutes = new Hono();

const todayJST = () => {
  const now = new Date();
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return jst.toISOString().slice(0, 10);
};

taskRoutes.get("/", async (c) => {
  const projectIdParam = c.req.query("projectId");
  const projectId = projectIdParam ? Number(projectIdParam) : null;

  const rows = projectId
    ? await db
        .select()
        .from(tasks)
        .where(eq(tasks.projectId, projectId))
        .orderBy(asc(tasks.projectId), asc(tasks.displayOrder))
    : await db
        .select()
        .from(tasks)
        .orderBy(asc(tasks.projectId), asc(tasks.displayOrder));

  return c.json(rows);
});

taskRoutes.post("/", async (c) => {
  const body = await c.req.json();
  const parsed = createTaskSchema.parse(body);

  const existing = await db
    .select({ displayOrder: tasks.displayOrder })
    .from(tasks)
    .where(eq(tasks.projectId, parsed.projectId));
  const maxOrder =
    existing.length > 0
      ? Math.max(...existing.map((t) => t.displayOrder)) + 1
      : 0;

  const result = await db
    .insert(tasks)
    .values({
      projectId: parsed.projectId,
      name: parsed.name,
      deadline: parsed.deadline ?? todayJST(),
      memo: parsed.memo ?? "",
      displayOrder: maxOrder,
    })
    .returning();

  return c.json(result[0], 201);
});

taskRoutes.patch("/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const body = await c.req.json();
  const parsed = updateTaskSchema.parse(body);

  const updateData: Record<string, unknown> = {
    updatedAt: new Date().toISOString(),
  };
  if (parsed.name !== undefined) updateData.name = parsed.name;
  if (parsed.deadline !== undefined) updateData.deadline = parsed.deadline;
  if (parsed.memo !== undefined) updateData.memo = parsed.memo;
  if (parsed.status !== undefined) updateData.status = parsed.status;

  const result = await db
    .update(tasks)
    .set(updateData)
    .where(eq(tasks.id, id))
    .returning();

  if (result.length === 0) {
    return c.json({ error: "Not found" }, 404);
  }
  return c.json(result[0]);
});

taskRoutes.patch("/:id/toggle-status", async (c) => {
  const id = Number(c.req.param("id"));

  const existing = await db.select().from(tasks).where(eq(tasks.id, id));
  if (existing.length === 0) {
    return c.json({ error: "Not found" }, 404);
  }

  const newStatus =
    existing[0].status === "todo" ? "in-progress" : "todo";
  const result = await db
    .update(tasks)
    .set({ status: newStatus, updatedAt: new Date().toISOString() })
    .where(eq(tasks.id, id))
    .returning();

  return c.json(result[0]);
});

taskRoutes.put("/reorder", async (c) => {
  const body = await c.req.json();
  const parsed = reorderTasksSchema.parse(body);

  for (const item of parsed.items) {
    await db
      .update(tasks)
      .set({
        projectId: item.projectId,
        displayOrder: item.displayOrder,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(tasks.id, item.id));
  }

  const rows = await db
    .select()
    .from(tasks)
    .orderBy(asc(tasks.projectId), asc(tasks.displayOrder));
  return c.json(rows);
});

taskRoutes.delete("/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const result = await db
    .delete(tasks)
    .where(eq(tasks.id, id))
    .returning();

  if (result.length === 0) {
    return c.json({ error: "Not found" }, 404);
  }
  return c.json({ success: true });
});
