import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import type { MidTermTask, MidTermStatus } from "@simple-task-manager/shared";
import { KanbanCard } from "./kanban-card";

const STATUS_CONFIG: Record<
  MidTermStatus,
  { label: string; icon: string }
> = {
  todo: { label: "Todo", icon: "📋" },
  "in-progress": { label: "In Progress", icon: "🔄" },
  done: { label: "Done", icon: "✅" },
};

interface KanbanColumnProps {
  status: MidTermStatus;
  tasks: MidTermTask[];
  onCardClick: (task: MidTermTask) => void;
}

export function KanbanColumn({ status, tasks, onCardClick }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const config = STATUS_CONFIG[status];

  return (
    <div
      ref={setNodeRef}
      className={`bg-muted/50 rounded-lg p-3 min-h-[300px] transition-colors ${
        isOver ? "bg-muted" : ""
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wide">
          {config.icon} {config.label}
        </span>
        <span className="bg-card rounded-full px-2 py-0.5 text-xs text-muted-foreground font-medium">
          {tasks.length}
        </span>
      </div>

      <SortableContext
        items={tasks.map((t) => t.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex flex-col gap-2">
          {tasks.map((task) => (
            <KanbanCard
              key={task.id}
              task={task}
              onClick={() => onCardClick(task)}
            />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}
