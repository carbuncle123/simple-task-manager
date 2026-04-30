import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  Project,
  CreateProject,
  UpdateProject,
} from "@simple-task-manager/shared";
import { api } from "@/lib/api";

const QUERY_KEY = ["projects"];

export function useProjects() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => api.get<Project[]>("/projects"),
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateProject) => api.post<Project>("/projects", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateProject }) =>
      api.patch<Project>(`/projects/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/projects/${id}`),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY });
      const previous = queryClient.getQueryData<Project[]>(QUERY_KEY);
      queryClient.setQueryData<Project[]>(QUERY_KEY, (old) =>
        old?.filter((p) => p.id !== id)
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
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useReorderProjects() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderedIds: number[]) =>
      api.put<Project[]>("/projects/reorder", { orderedIds }),
    onMutate: async (orderedIds) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY });
      const previous = queryClient.getQueryData<Project[]>(QUERY_KEY);
      queryClient.setQueryData<Project[]>(QUERY_KEY, (old) => {
        if (!old) return old;
        const byId = new Map(old.map((p) => [p.id, p]));
        return orderedIds
          .map((id, i) => {
            const p = byId.get(id);
            return p ? { ...p, displayOrder: i } : null;
          })
          .filter((p): p is Project => p !== null);
      });
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
