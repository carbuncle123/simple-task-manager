import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  Task,
  CreateTask,
  UpdateTask,
} from "@simple-task-manager/shared";
import { api } from "@/lib/api";

const QUERY_KEY = ["tasks"];

export function useTasks() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => api.get<Task[]>("/tasks"),
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTask) => api.post<Task>("/tasks", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateTask }) =>
      api.patch<Task>(`/tasks/${id}`, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY });
      const previous = queryClient.getQueryData<Task[]>(QUERY_KEY);
      queryClient.setQueryData<Task[]>(QUERY_KEY, (old) =>
        old?.map((t) => (t.id === id ? { ...t, ...data } : t))
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(QUERY_KEY, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useToggleTaskStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.patch<Task>(`/tasks/${id}/toggle-status`, {}),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY });
      const previous = queryClient.getQueryData<Task[]>(QUERY_KEY);
      queryClient.setQueryData<Task[]>(QUERY_KEY, (old) =>
        old?.map((t) =>
          t.id === id
            ? { ...t, status: t.status === "todo" ? "in-progress" : "todo" }
            : t
        )
      );
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(QUERY_KEY, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/tasks/${id}`),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY });
      const previous = queryClient.getQueryData<Task[]>(QUERY_KEY);
      queryClient.setQueryData<Task[]>(QUERY_KEY, (old) =>
        old?.filter((t) => t.id !== id)
      );
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(QUERY_KEY, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export interface ReorderItem {
  id: number;
  projectId: number;
  displayOrder: number;
}

export function useReorderTasks() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (items: ReorderItem[]) =>
      api.put<Task[]>("/tasks/reorder", { items }),
    onMutate: async (items) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY });
      const previous = queryClient.getQueryData<Task[]>(QUERY_KEY);
      const byId = new Map(items.map((i) => [i.id, i]));
      queryClient.setQueryData<Task[]>(QUERY_KEY, (old) =>
        old?.map((t) => {
          const item = byId.get(t.id);
          return item
            ? { ...t, projectId: item.projectId, displayOrder: item.displayOrder }
            : t;
        })
      );
      return { previous };
    },
    onError: (_err, _items, context) => {
      if (context?.previous) {
        queryClient.setQueryData(QUERY_KEY, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}
