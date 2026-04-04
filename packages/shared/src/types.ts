import { z } from "zod";

// ===== Short-term Tasks =====

export const shortTermStatusSchema = z.enum(["todo", "done"]);
export type ShortTermStatus = z.infer<typeof shortTermStatusSchema>;

export const createShortTermTaskSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});
export type CreateShortTermTask = z.infer<typeof createShortTermTaskSchema>;

export const updateShortTermTaskSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  status: shortTermStatusSchema.optional(),
});
export type UpdateShortTermTask = z.infer<typeof updateShortTermTaskSchema>;

export const reorderShortTermSchema = z.object({
  orderedIds: z.array(z.number()),
});

export interface ShortTermTask {
  id: number;
  name: string;
  description: string;
  status: ShortTermStatus;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

// ===== Mid-term Tasks =====

export const midTermStatusSchema = z.enum(["todo", "in-progress", "done"]);
export type MidTermStatus = z.infer<typeof midTermStatusSchema>;

export const createMidTermTaskSchema = z.object({
  name: z.string().min(1),
  category: z.string().optional(),
  startDate: z.string().optional(),
  deadline: z.string().optional(),
  memo: z.string().optional(),
});
export type CreateMidTermTask = z.infer<typeof createMidTermTaskSchema>;

export const updateMidTermTaskSchema = z.object({
  name: z.string().min(1).optional(),
  category: z.string().optional(),
  startDate: z.string().nullable().optional(),
  deadline: z.string().nullable().optional(),
  status: midTermStatusSchema.optional(),
  memo: z.string().optional(),
});
export type UpdateMidTermTask = z.infer<typeof updateMidTermTaskSchema>;

export const reorderMidTermSchema = z.object({
  items: z.array(
    z.object({
      id: z.number(),
      status: midTermStatusSchema,
      displayOrder: z.number(),
    })
  ),
});

export interface MidTermTask {
  id: number;
  name: string;
  category: string;
  startDate: string | null;
  deadline: string | null;
  status: MidTermStatus;
  memo: string;
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
