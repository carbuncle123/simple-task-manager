import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Task } from "@simple-task-manager/shared";
import { TaskCard } from "./task-card";

interface SortableTaskCardProps {
  task: Task;
  isSelected?: boolean;
  onSelect?: (taskId: number) => void;
  onDeleted?: (taskId: number) => void;
}

export function SortableTaskCard({
  task,
  isSelected,
  onSelect,
  onDeleted,
}: SortableTaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, data: { type: "task", task } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <TaskCard
        task={task}
        dragHandleProps={listeners}
        isDragging={isDragging}
        isSelected={isSelected}
        onSelect={onSelect}
        onDeleted={onDeleted}
      />
    </div>
  );
}
