import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { AddTaskForm } from "@/components/short-term/add-task-form";
import { TaskList } from "@/components/short-term/task-list";
import { useShortTermTasks } from "@/hooks/use-short-term-tasks";

interface ShortTermPanelProps {
  isOpen: boolean;
}

export function ShortTermPanel({ isOpen }: ShortTermPanelProps) {
  const { data: tasks = [], isLoading } = useShortTermTasks();
  const todoCount = tasks.filter((t) => t.status === "todo").length;

  return (
    <div
      className={cn(
        "border rounded-lg bg-card overflow-hidden flex flex-col transition-all duration-300 ease-in-out",
        isOpen ? "p-4 border-border" : "p-0 border-transparent"
      )}
    >
      <div className="min-w-[250px]">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-bold">今すぐやる</span>
          <span className="text-xs text-muted-foreground">
            {todoCount}件
          </span>
        </div>

        <AddTaskForm />

        {isLoading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="overflow-y-auto flex-1">
            <TaskList tasks={tasks} />
          </div>
        )}
      </div>
    </div>
  );
}
