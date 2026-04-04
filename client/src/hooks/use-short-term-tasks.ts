import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  ShortTermTask,
  CreateShortTermTask,
  UpdateShortTermTask,
} from "@simple-task-manager/shared";
import { api } from "@/lib/api";

const QUERY_KEY = ["short-term-tasks"];

export function useShortTermTasks() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => api.get<ShortTermTask[]>("/short-term"),
  });
}

export function useCreateShortTermTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateShortTermTask) =>
      api.post<ShortTermTask>("/short-term", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useUpdateShortTermTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateShortTermTask }) =>
      api.patch<ShortTermTask>(`/short-term/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useToggleShortTermTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      api.patch<ShortTermTask>(`/short-term/${id}/toggle`, {}),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY });
      const previous = queryClient.getQueryData<ShortTermTask[]>(QUERY_KEY);
      queryClient.setQueryData<ShortTermTask[]>(QUERY_KEY, (old) =>
        old?.map((t) =>
          t.id === id
            ? { ...t, status: t.status === "todo" ? "done" : "todo" } as ShortTermTask
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

export function useDeleteShortTermTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/short-term/${id}`),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY });
      const previous = queryClient.getQueryData<ShortTermTask[]>(QUERY_KEY);
      queryClient.setQueryData<ShortTermTask[]>(QUERY_KEY, (old) =>
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

export function useReorderShortTermTasks() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderedIds: number[]) =>
      api.put<ShortTermTask[]>("/short-term/reorder", { orderedIds }),
    onMutate: async (orderedIds) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY });
      const previous = queryClient.getQueryData<ShortTermTask[]>(QUERY_KEY);
      if (previous) {
        const taskMap = new Map(previous.map((t) => [t.id, t]));
        const reordered = orderedIds
          .map((id) => taskMap.get(id))
          .filter(Boolean) as ShortTermTask[];
        queryClient.setQueryData(QUERY_KEY, reordered);
      }
      return { previous };
    },
    onError: (_err, _ids, context) => {
      if (context?.previous) {
        queryClient.setQueryData(QUERY_KEY, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}
