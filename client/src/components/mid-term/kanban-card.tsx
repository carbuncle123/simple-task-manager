import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { MidTermTask } from "@simple-task-manager/shared";

interface KanbanCardProps {
  task: MidTermTask;
  onClick: () => void;
}

export function KanbanCard({ task, onClick }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, data: { type: "card", task } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isOverdue =
    task.deadline &&
    task.status !== "done" &&
    new Date(task.deadline) < new Date();

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-card border border-border rounded-lg p-3 cursor-grab hover:shadow-sm transition-shadow"
      onClick={onClick}
    >
      <div className="text-sm font-medium mb-2">{task.name}</div>
      <div className="flex gap-1.5 flex-wrap">
        {task.category && (
          <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-medium bg-violet-100 text-violet-700">
            {task.category}
          </span>
        )}
        {task.deadline && (
          <span
            className={cn(
              "inline-block px-2 py-0.5 rounded-full text-[11px] font-medium",
              isOverdue
                ? "bg-red-100 text-red-700"
                : "bg-amber-100 text-amber-700"
            )}
          >
            {format(new Date(task.deadline), "M/d")}
          </span>
        )}
      </div>
    </div>
  );
}
