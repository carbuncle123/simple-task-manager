import { Hono } from "hono";
import { eq, asc } from "drizzle-orm";
import { db } from "../db/index.js";
import { midTermTasks } from "../db/schema.js";
import {
  createMidTermTaskSchema,
  updateMidTermTaskSchema,
  reorderMidTermSchema,
} from "@simple-task-manager/shared";

export const midTermRoutes = new Hono();

// GET / — List all tasks
midTermRoutes.get("/", async (c) => {
  const tasks = await db
    .select()
    .from(midTermTasks)
    .orderBy(asc(midTermTasks.displayOrder));
  return c.json(tasks);
});

// POST / — Create a new task
midTermRoutes.post("/", async (c) => {
  const body = await c.req.json();
  const parsed = createMidTermTaskSchema.parse(body);

  const existing = await db
    .select({ maxOrder: midTermTasks.displayOrder })
    .from(midTermTasks)
    .orderBy(asc(midTermTasks.displayOrder));
  const maxOrder =
    existing.length > 0
      ? Math.max(...existing.map((t) => t.maxOrder)) + 1
      : 0;

  const result = await db
    .insert(midTermTasks)
    .values({
      name: parsed.name,
      category: parsed.category ?? "",
      startDate: parsed.startDate ?? null,
      deadline: parsed.deadline ?? null,
      memo: parsed.memo ?? "",
      displayOrder: maxOrder,
    })
    .returning();

  return c.json(result[0], 201);
});

// PATCH /:id — Update a task
midTermRoutes.patch("/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const body = await c.req.json();
  const parsed = updateMidTermTaskSchema.parse(body);

  const updateData: Record<string, unknown> = {
    updatedAt: new Date().toISOString(),
  };
  if (parsed.name !== undefined) updateData.name = parsed.name;
  if (parsed.category !== undefined) updateData.category = parsed.category;
  if (parsed.startDate !== undefined) updateData.startDate = parsed.startDate;
  if (parsed.deadline !== undefined) updateData.deadline = parsed.deadline;
  if (parsed.status !== undefined) updateData.status = parsed.status;
  if (parsed.memo !== undefined) updateData.memo = parsed.memo;

  const result = await db
    .update(midTermTasks)
    .set(updateData)
    .where(eq(midTermTasks.id, id))
    .returning();

  if (result.length === 0) {
    return c.json({ error: "Not found" }, 404);
  }
  return c.json(result[0]);
});

// PUT /reorder — Bulk reorder (kanban cross-column)
midTermRoutes.put("/reorder", async (c) => {
  const body = await c.req.json();
  const parsed = reorderMidTermSchema.parse(body);

  for (const item of parsed.items) {
    await db
      .update(midTermTasks)
      .set({
        status: item.status,
        displayOrder: item.displayOrder,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(midTermTasks.id, item.id));
  }

  const tasks = await db
    .select()
    .from(midTermTasks)
    .orderBy(asc(midTermTasks.displayOrder));
  return c.json(tasks);
});

// DELETE /:id — Delete a task
midTermRoutes.delete("/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const result = await db
    .delete(midTermTasks)
    .where(eq(midTermTasks.id, id))
    .returning();

  if (result.length === 0) {
    return c.json({ error: "Not found" }, 404);
  }
  return c.json({ success: true });
});
