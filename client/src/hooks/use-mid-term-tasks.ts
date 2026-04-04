import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  MidTermTask,
  MidTermStatus,
  CreateMidTermTask,
  UpdateMidTermTask,
} from "@simple-task-manager/shared";
import { api } from "@/lib/api";

const QUERY_KEY = ["mid-term-tasks"];

export function useMidTermTasks() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => api.get<MidTermTask[]>("/mid-term"),
  });
}

export function useCreateMidTermTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateMidTermTask) =>
      api.post<MidTermTask>("/mid-term", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useUpdateMidTermTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateMidTermTask }) =>
      api.patch<MidTermTask>(`/mid-term/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useDeleteMidTermTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/mid-term/${id}`),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY });
      const previous = queryClient.getQueryData<MidTermTask[]>(QUERY_KEY);
      queryClient.setQueryData<MidTermTask[]>(QUERY_KEY, (old) =>
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

export function useReorderMidTermTasks() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (
      items: { id: number; status: MidTermStatus; displayOrder: number }[]
    ) => api.put<MidTermTask[]>("/mid-term/reorder", { items }),
    onMutate: async (items) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY });
      const previous = queryClient.getQueryData<MidTermTask[]>(QUERY_KEY);
      if (previous) {
        const updated = previous.map((t) => {
          const item = items.find((i) => i.id === t.id);
          if (item) {
            return {
              ...t,
              status: item.status,
              displayOrder: item.displayOrder,
            };
          }
          return t;
        });
        updated.sort((a, b) => a.displayOrder - b.displayOrder);
        queryClient.setQueryData(QUERY_KEY, updated);
      }
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
