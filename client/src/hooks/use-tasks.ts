import { useQuery } from "@tanstack/react-query";
import type { Task } from "@simple-task-manager/shared";
import { api } from "@/lib/api";

const QUERY_KEY = ["tasks"];

export function useTasks() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => api.get<Task[]>("/tasks"),
  });
}
