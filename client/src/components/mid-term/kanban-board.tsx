import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import type { MidTermTask, MidTermStatus } from "@simple-task-manager/shared";
import { KanbanColumn } from "./kanban-column";
import { useReorderMidTermTasks } from "@/hooks/use-mid-term-tasks";

const STATUSES: MidTermStatus[] = ["todo", "in-progress", "done"];

interface KanbanBoardProps {
  tasks: MidTermTask[];
  onCardClick: (task: MidTermTask) => void;
}

export function KanbanBoard({ tasks, onCardClick }: KanbanBoardProps) {
  const reorder = useReorderMidTermTasks();
  const [activeTask, setActiveTask] = useState<MidTermTask | null>(null);
  const [localTasks, setLocalTasks] = useState<MidTermTask[] | null>(null);

  const currentTasks = localTasks ?? tasks;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const getTasksByStatus = (status: MidTermStatus) =>
    currentTasks
      .filter((t) => t.status === status)
      .sort((a, b) => a.displayOrder - b.displayOrder);

  const findContainer = (id: string | number): MidTermStatus | null => {
    if (STATUSES.includes(id as MidTermStatus)) return id as MidTermStatus;
    const task = currentTasks.find((t) => t.id === id);
    return task ? (task.status as MidTermStatus) : null;
  };

  const handleDragStart = (event: DragStartEvent) => {
    const task = currentTasks.find((t) => t.id === event.active.id);
    if (task) {
      setActiveTask(task);
      setLocalTasks([...currentTasks]);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over || !localTasks) return;

    const activeContainer = findContainer(active.id);
    const overContainer = findContainer(over.id);

    if (!activeContainer || !overContainer || activeContainer === overContainer)
      return;

    setLocalTasks((prev) => {
      if (!prev) return prev;
      return prev.map((t) =>
        t.id === active.id
          ? { ...t, status: overContainer }
          : t
      );
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over || !localTasks) {
      setLocalTasks(null);
      return;
    }

    const activeContainer = findContainer(active.id);
    const overContainer = findContainer(over.id);

    if (!activeContainer || !overContainer) {
      setLocalTasks(null);
      return;
    }

    // Build new order for affected columns
    const updatedTasks = [...localTasks];
    const activeIdx = updatedTasks.findIndex((t) => t.id === active.id);
    const activeTask = updatedTasks[activeIdx];

    if (activeTask.status !== overContainer) {
      activeTask.status = overContainer;
    }

    // If dropping on another card, reorder within column
    if (over.id !== overContainer) {
      const columnTasks = updatedTasks
        .filter((t) => t.status === overContainer && t.id !== active.id)
        .sort((a, b) => a.displayOrder - b.displayOrder);

      const overIdx = columnTasks.findIndex((t) => t.id === over.id);
      columnTasks.splice(overIdx >= 0 ? overIdx : columnTasks.length, 0, activeTask);

      columnTasks.forEach((t, i) => {
        t.displayOrder = i;
      });
    }

    // Build reorder items for all tasks in affected columns
    const affectedStatuses = new Set([activeContainer, overContainer]);
    const reorderItems: { id: number; status: MidTermStatus; displayOrder: number }[] = [];

    for (const status of affectedStatuses) {
      const columnTasks = updatedTasks
        .filter((t) => t.status === status)
        .sort((a, b) => a.displayOrder - b.displayOrder);
      columnTasks.forEach((t, i) => {
        reorderItems.push({ id: t.id, status: status as MidTermStatus, displayOrder: i });
      });
    }

    setLocalTasks(null);
    reorder.mutate(reorderItems);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-3 gap-4 flex-1">
        {STATUSES.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            tasks={getTasksByStatus(status)}
            onCardClick={onCardClick}
          />
        ))}
      </div>

      <DragOverlay>
        {activeTask && (
          <div className="bg-card border border-primary rounded-lg p-3 shadow-lg opacity-90 rotate-2">
            <div className="text-sm font-medium">{activeTask.name}</div>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
