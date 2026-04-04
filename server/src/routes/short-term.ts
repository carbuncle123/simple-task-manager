import { Hono } from "hono";
import { eq, asc } from "drizzle-orm";
import { db } from "../db/index.js";
import { shortTermTasks } from "../db/schema.js";
import {
  createShortTermTaskSchema,
  updateShortTermTaskSchema,
  reorderShortTermSchema,
} from "@simple-task-manager/shared";

export const shortTermRoutes = new Hono();

// GET / — List all tasks ordered by displayOrder
shortTermRoutes.get("/", async (c) => {
  const tasks = await db
    .select()
    .from(shortTermTasks)
    .orderBy(asc(shortTermTasks.displayOrder));
  return c.json(tasks);
});

// POST / — Create a new task
shortTermRoutes.post("/", async (c) => {
  const body = await c.req.json();
  const parsed = createShortTermTaskSchema.parse(body);

  // Set displayOrder to max + 1
  const existing = await db
    .select({ maxOrder: shortTermTasks.displayOrder })
    .from(shortTermTasks)
    .orderBy(asc(shortTermTasks.displayOrder));
  const maxOrder =
    existing.length > 0
      ? Math.max(...existing.map((t) => t.maxOrder)) + 1
      : 0;

  const result = await db
    .insert(shortTermTasks)
    .values({
      name: parsed.name,
      description: parsed.description ?? "",
      displayOrder: maxOrder,
    })
    .returning();

  return c.json(result[0], 201);
});

// PATCH /:id — Update a task
shortTermRoutes.patch("/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const body = await c.req.json();
  const parsed = updateShortTermTaskSchema.parse(body);

  const result = await db
    .update(shortTermTasks)
    .set({ ...parsed, updatedAt: new Date().toISOString() })
    .where(eq(shortTermTasks.id, id))
    .returning();

  if (result.length === 0) {
    return c.json({ error: "Not found" }, 404);
  }
  return c.json(result[0]);
});

// PATCH /:id/toggle — Toggle status
shortTermRoutes.patch("/:id/toggle", async (c) => {
  const id = Number(c.req.param("id"));

  const existing = await db
    .select()
    .from(shortTermTasks)
    .where(eq(shortTermTasks.id, id));

  if (existing.length === 0) {
    return c.json({ error: "Not found" }, 404);
  }

  const newStatus = existing[0].status === "todo" ? "done" : "todo";
  const result = await db
    .update(shortTermTasks)
    .set({ status: newStatus, updatedAt: new Date().toISOString() })
    .where(eq(shortTermTasks.id, id))
    .returning();

  return c.json(result[0]);
});

// PUT /reorder — Bulk reorder
shortTermRoutes.put("/reorder", async (c) => {
  const body = await c.req.json();
  const parsed = reorderShortTermSchema.parse(body);

  const sqliteDb = (db as unknown as { $client: { transaction: (fn: (tx: unknown) => void) => void } }).$client;
  sqliteDb.transaction(() => {
    for (let i = 0; i < parsed.orderedIds.length; i++) {
      db.update(shortTermTasks)
        .set({ displayOrder: i, updatedAt: new Date().toISOString() })
        .where(eq(shortTermTasks.id, parsed.orderedIds[i]))
        .run();
    }
  });

  const tasks = await db
    .select()
    .from(shortTermTasks)
    .orderBy(asc(shortTermTasks.displayOrder));
  return c.json(tasks);
});

// DELETE /:id — Delete a task
shortTermRoutes.delete("/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const result = await db
    .delete(shortTermTasks)
    .where(eq(shortTermTasks.id, id))
    .returning();

  if (result.length === 0) {
    return c.json({ error: "Not found" }, 404);
  }
  return c.json({ success: true });
});
