import { Hono } from "hono";
import { eq, asc } from "drizzle-orm";
import { db } from "../db/index.js";
import { projects } from "../db/schema.js";
import {
  createProjectSchema,
  updateProjectSchema,
  reorderProjectsSchema,
} from "@simple-task-manager/shared";

export const projectRoutes = new Hono();

projectRoutes.get("/", async (c) => {
  const rows = await db
    .select()
    .from(projects)
    .orderBy(asc(projects.displayOrder));
  return c.json(rows);
});

projectRoutes.post("/", async (c) => {
  const body = await c.req.json();
  const parsed = createProjectSchema.parse(body);

  const existing = await db
    .select({ displayOrder: projects.displayOrder })
    .from(projects);
  const maxOrder =
    existing.length > 0
      ? Math.max(...existing.map((p) => p.displayOrder)) + 1
      : 0;

  const result = await db
    .insert(projects)
    .values({
      name: parsed.name,
      displayOrder: maxOrder,
    })
    .returning();

  return c.json(result[0], 201);
});

projectRoutes.patch("/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const body = await c.req.json();
  const parsed = updateProjectSchema.parse(body);

  const result = await db
    .update(projects)
    .set({ ...parsed, updatedAt: new Date().toISOString() })
    .where(eq(projects.id, id))
    .returning();

  if (result.length === 0) {
    return c.json({ error: "Not found" }, 404);
  }
  return c.json(result[0]);
});

projectRoutes.put("/reorder", async (c) => {
  const body = await c.req.json();
  const parsed = reorderProjectsSchema.parse(body);

  for (let i = 0; i < parsed.orderedIds.length; i++) {
    await db
      .update(projects)
      .set({ displayOrder: i, updatedAt: new Date().toISOString() })
      .where(eq(projects.id, parsed.orderedIds[i]));
  }

  const rows = await db
    .select()
    .from(projects)
    .orderBy(asc(projects.displayOrder));
  return c.json(rows);
});

projectRoutes.delete("/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const result = await db
    .delete(projects)
    .where(eq(projects.id, id))
    .returning();

  if (result.length === 0) {
    return c.json({ error: "Not found" }, 404);
  }
  return c.json({ success: true });
});
