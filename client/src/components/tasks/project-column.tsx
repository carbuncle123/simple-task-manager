import { useEffect } from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { ChevronDown } from "lucide-react";
import type { Project, Task } from "@simple-task-manager/shared";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { AddTaskForm } from "./add-task-form";
import { SortableTaskCard } from "./sortable-task-card";

interface ProjectColumnProps {
  project: Project;
  tasks: Task[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectTask: (taskId: number) => void;
  onTaskDeleted: (taskId: number) => void;
  selectedTaskId: number | null;
}

export function ProjectColumn({
  project,
  tasks,
  open,
  onOpenChange,
  onSelectTask,
  onTaskDeleted,
  selectedTaskId,
}: ProjectColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `column-${project.id}`,
    data: { type: "column", projectId: project.id },
  });

  useEffect(() => {
    if (!isOver || open) return;
    const timer = window.setTimeout(() => onOpenChange(true), 250);
    return () => window.clearTimeout(timer);
  }, [isOver, onOpenChange, open]);

  return (
    <Collapsible open={open} onOpenChange={onOpenChange}>
      <section
        ref={setNodeRef}
        className={cn(
          "overflow-hidden rounded-2xl border bg-white shadow-sm transition-colors",
          isOver ? "border-blue-300 bg-blue-50/40" : "border-slate-200"
        )}
      >
        <CollapsibleTrigger className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left hover:bg-slate-50">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="truncate text-sm font-semibold text-slate-900">{project.name}</h2>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                {tasks.length}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {open ? "タスク一覧を表示中" : "クリックして展開"}
            </p>
          </div>
          <ChevronDown
            className={cn(
              "h-4 w-4 flex-shrink-0 text-slate-400 transition-transform",
              open && "rotate-180"
            )}
          />
        </CollapsibleTrigger>

        <CollapsibleContent className="border-t border-slate-200">
          <div className="border-b border-slate-200 px-4 py-3">
            <AddTaskForm projectId={project.id} />
          </div>

          <div className="space-y-3 px-3 py-3">
            <SortableContext
              items={tasks.map((task) => task.id)}
              strategy={verticalListSortingStrategy}
            >
              {tasks.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center">
                  <p className="text-xs leading-relaxed text-slate-400">
                    まだタスクがありません
                    <br />
                    上のフォームから追加できます
                  </p>
                </div>
              ) : (
                tasks.map((task) => (
                  <SortableTaskCard
                    key={task.id}
                    task={task}
                    isSelected={selectedTaskId === task.id}
                    onSelect={onSelectTask}
                    onDeleted={onTaskDeleted}
                  />
                ))
              )}
            </SortableContext>
          </div>
        </CollapsibleContent>
      </section>
    </Collapsible>
  );
}
