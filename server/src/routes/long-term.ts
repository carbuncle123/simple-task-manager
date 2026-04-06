import { Hono } from "hono";
import { eq, asc } from "drizzle-orm";
import { db } from "../db/index.js";
import { longTermTasks } from "../db/schema.js";
import {
  createLongTermTaskSchema,
  updateLongTermTaskSchema,
} from "@simple-task-manager/shared";

export const longTermRoutes = new Hono();

// GET / — List all tasks ordered by category then createdAt
longTermRoutes.get("/", async (c) => {
  const tasks = await db
    .select()
    .from(longTermTasks)
    .orderBy(asc(longTermTasks.category), asc(longTermTasks.createdAt));
  return c.json(tasks);
});

// GET /categories — List distinct categories
longTermRoutes.get("/categories", async (c) => {
  const rows = await db
    .selectDistinct({ category: longTermTasks.category })
    .from(longTermTasks)
    .orderBy(asc(longTermTasks.category));
  return c.json(rows.map((r) => r.category));
});

// POST / — Create a new task
longTermRoutes.post("/", async (c) => {
  const body = await c.req.json();
  const parsed = createLongTermTaskSchema.parse(body);

  const result = await db
    .insert(longTermTasks)
    .values({
      name: parsed.name,
      category: parsed.category ?? "未分類",
      memo: parsed.memo ?? "",
    })
    .returning();

  return c.json(result[0], 201);
});

// PATCH /:id — Update a task
longTermRoutes.patch("/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const body = await c.req.json();
  const parsed = updateLongTermTaskSchema.parse(body);

  const result = await db
    .update(longTermTasks)
    .set({ ...parsed, updatedAt: new Date().toISOString() })
    .where(eq(longTermTasks.id, id))
    .returning();

  if (result.length === 0) {
    return c.json({ error: "Not found" }, 404);
  }
  return c.json(result[0]);
});

// DELETE /:id — Delete a task
longTermRoutes.delete("/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const result = await db
    .delete(longTermTasks)
    .where(eq(longTermTasks.id, id))
    .returning();

  if (result.length === 0) {
    return c.json({ error: "Not found" }, 404);
  }
  return c.json({ success: true });
});
