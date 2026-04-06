import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  LongTermTask,
  CreateLongTermTask,
  UpdateLongTermTask,
} from "@simple-task-manager/shared";
import { api } from "@/lib/api";

const QUERY_KEY = ["long-term-tasks"];
const CATEGORIES_KEY = ["long-term-categories"];

export function useLongTermTasks() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => api.get<LongTermTask[]>("/long-term"),
  });
}

export function useLongTermCategories() {
  return useQuery({
    queryKey: CATEGORIES_KEY,
    queryFn: () => api.get<string[]>("/long-term/categories"),
  });
}

export function useCreateLongTermTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateLongTermTask) =>
      api.post<LongTermTask>("/long-term", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: CATEGORIES_KEY });
    },
  });
}

export function useUpdateLongTermTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateLongTermTask }) =>
      api.patch<LongTermTask>(`/long-term/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: CATEGORIES_KEY });
    },
  });
}

export function useDeleteLongTermTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/long-term/${id}`),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY });
      const previous = queryClient.getQueryData<LongTermTask[]>(QUERY_KEY);
      queryClient.setQueryData<LongTermTask[]>(QUERY_KEY, (old) =>
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
      queryClient.invalidateQueries({ queryKey: CATEGORIES_KEY });
    },
  });
}
