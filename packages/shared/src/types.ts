import { z } from "zod";

// ===== Projects =====

export const createProjectSchema = z.object({
  name: z.string().min(1),
});
export type CreateProject = z.infer<typeof createProjectSchema>;

export const updateProjectSchema = z.object({
  name: z.string().min(1).optional(),
});
export type UpdateProject = z.infer<typeof updateProjectSchema>;

export const reorderProjectsSchema = z.object({
  orderedIds: z.array(z.number()),
});

export interface Project {
  id: number;
  name: string;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

// ===== Tasks =====

export const taskStatusSchema = z.enum(["todo", "in-progress"]);
export type TaskStatus = z.infer<typeof taskStatusSchema>;

const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "deadline must be YYYY-MM-DD");

export const createTaskSchema = z.object({
  projectId: z.number(),
  name: z.string().min(1),
  deadline: dateSchema.optional(),
  memo: z.string().optional(),
});
export type CreateTask = z.infer<typeof createTaskSchema>;

export const updateTaskSchema = z.object({
  name: z.string().min(1).optional(),
  deadline: dateSchema.optional(),
  memo: z.string().optional(),
  status: taskStatusSchema.optional(),
});
export type UpdateTask = z.infer<typeof updateTaskSchema>;

export const reorderTasksSchema = z.object({
  items: z.array(
    z.object({
      id: z.number(),
      projectId: z.number(),
      displayOrder: z.number(),
    })
  ),
});

export interface Task {
  id: number;
  projectId: number;
  name: string;
  deadline: string;
  memo: string;
  status: TaskStatus;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

// ===== Long-term Tasks =====

export const createLongTermTaskSchema = z.object({
  name: z.string().min(1),
  category: z.string().optional(),
  memo: z.string().optional(),
});
export type CreateLongTermTask = z.infer<typeof createLongTermTaskSchema>;

export const updateLongTermTaskSchema = z.object({
  name: z.string().min(1).optional(),
  category: z.string().optional(),
  memo: z.string().optional(),
});
export type UpdateLongTermTask = z.infer<typeof updateLongTermTaskSchema>;

export interface LongTermTask {
  id: number;
  name: string;
  category: string;
  memo: string;
  createdAt: string;
  updatedAt: string;
}
