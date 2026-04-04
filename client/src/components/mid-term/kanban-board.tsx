import { useCallback, useEffect, useRef, useState } from "react";
import {
  DndContext,
  DragOverlay,
  pointerWithin,
  rectIntersection,
  getFirstCollision,
  MeasuringStrategy,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
  type CollisionDetection,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useDroppable } from "@dnd-kit/core";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { MidTermTask, MidTermStatus } from "@simple-task-manager/shared";
import { useReorderMidTermTasks } from "@/hooks/use-mid-term-tasks";

const STATUSES: MidTermStatus[] = ["todo", "in-progress", "done"];
const STATUS_LABELS: Record<MidTermStatus, { label: string; icon: string }> = {
  todo: { label: "Todo", icon: "📋" },
  "in-progress": { label: "In Progress", icon: "🔄" },
  done: { label: "Done", icon: "✅" },
};

// --- Types ---
type Items = Record<MidTermStatus, number[]>;

// --- Sortable Card ---
function SortableCard({
  task,
  onClick,
}: {
  task: MidTermTask;
  onClick: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 1 : 0,
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
      className="bg-card border border-border rounded-lg p-3 cursor-grab active:cursor-grabbing hover:shadow-sm transition-shadow"
      onClick={() => {
        if (!isDragging) onClick();
      }}
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

// --- Droppable Column ---
function DroppableColumn({
  status,
  taskIds,
  taskMap,
  onCardClick,
}: {
  status: MidTermStatus;
  taskIds: number[];
  taskMap: Map<number, MidTermTask>;
  onCardClick: (task: MidTermTask) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `column-${status}` });
  const config = STATUS_LABELS[status];

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "rounded-lg p-3 min-h-[300px] transition-colors",
        isOver ? "bg-muted" : "bg-muted/50"
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wide">
          {config.icon} {config.label}
        </span>
        <span className="bg-card rounded-full px-2 py-0.5 text-xs text-muted-foreground font-medium">
          {taskIds.length}
        </span>
      </div>

      <SortableContext
        items={taskIds}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex flex-col gap-2 min-h-[40px]">
          {taskIds.map((id) => {
            const task = taskMap.get(id);
            if (!task) return null;
            return (
              <SortableCard
                key={id}
                task={task}
                onClick={() => onCardClick(task)}
              />
            );
          })}
        </div>
      </SortableContext>
    </div>
  );
}

// --- Board ---
interface KanbanBoardProps {
  tasks: MidTermTask[];
  onCardClick: (task: MidTermTask) => void;
}

function buildItems(tasks: MidTermTask[]): Items {
  const items: Items = { todo: [], "in-progress": [], done: [] };
  const sorted = [...tasks].sort((a, b) => a.displayOrder - b.displayOrder);
  for (const task of sorted) {
    if (items[task.status as MidTermStatus]) {
      items[task.status as MidTermStatus].push(task.id);
    }
  }
  return items;
}

export function KanbanBoard({ tasks, onCardClick }: KanbanBoardProps) {
  const reorder = useReorderMidTermTasks();
  const [items, setItems] = useState<Items>(() => buildItems(tasks));
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const lastOverId = useRef<UniqueIdentifier | null>(null);
  const recentlyMovedToNewContainer = useRef(false);

  const taskMap = new Map(tasks.map((t) => [t.id, t]));

  // Sync items when tasks change from server
  useEffect(() => {
    if (!activeId) {
      setItems(buildItems(tasks));
    }
  }, [tasks, activeId]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const findContainer = (id: UniqueIdentifier): MidTermStatus | null => {
    // Check if it's a column id
    const colMatch = String(id).match(/^column-(.+)$/);
    if (colMatch && STATUSES.includes(colMatch[1] as MidTermStatus)) {
      return colMatch[1] as MidTermStatus;
    }
    // Check which column contains this task id
    for (const status of STATUSES) {
      if (items[status].includes(id as number)) return status;
    }
    return null;
  };

  const collisionDetection: CollisionDetection = useCallback(
    (args) => {
      if (activeId && findContainer(activeId)) {
        // First check pointer collisions with columns
        const pointerCollisions = pointerWithin(args);
        if (pointerCollisions.length > 0) {
          let overId = getFirstCollision(pointerCollisions, "id");
          if (overId != null) {
            const container = findContainer(overId);
            if (container) {
              const containerItems = items[container];
              if (containerItems.length > 0) {
                // Find closest card within that column
                const cardCollisions = rectIntersection({
                  ...args,
                  droppableContainers: args.droppableContainers.filter(
                    (c) =>
                      c.id !== `column-${container}` &&
                      containerItems.includes(c.id as number)
                  ),
                });
                if (cardCollisions.length > 0) {
                  overId = cardCollisions[0].id;
                }
              }
            }
            lastOverId.current = overId;
            return [{ id: overId }];
          }
        }

        // Fallback to rect intersection
        const rectCollisions = rectIntersection(args);
        if (rectCollisions.length > 0) {
          lastOverId.current = rectCollisions[0].id;
          return [rectCollisions[0]];
        }
      }

      return lastOverId.current ? [{ id: lastOverId.current }] : [];
    },
    [activeId, items]
  );

  const handleDragStart = ({ active }: DragStartEvent) => {
    setActiveId(active.id);
  };

  const handleDragOver = ({ active, over }: DragOverEvent) => {
    if (!over) return;

    const activeContainer = findContainer(active.id);
    const overContainer = findContainer(over.id);

    if (!activeContainer || !overContainer || activeContainer === overContainer)
      return;

    setItems((prev) => {
      const activeItems = [...prev[activeContainer]];
      const overItems = [...prev[overContainer]];

      const activeIndex = activeItems.indexOf(active.id as number);

      // Determine insertion index
      const overIndex = overItems.indexOf(over.id as number);
      const newIndex = overIndex >= 0 ? overIndex : overItems.length;

      // Remove from source
      activeItems.splice(activeIndex, 1);
      // Insert into destination
      overItems.splice(newIndex, 0, active.id as number);

      recentlyMovedToNewContainer.current = true;

      return {
        ...prev,
        [activeContainer]: activeItems,
        [overContainer]: overItems,
      };
    });
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    const activeContainer = findContainer(active.id);

    if (!activeContainer) {
      setActiveId(null);
      return;
    }

    if (!over) {
      setActiveId(null);
      return;
    }

    const overContainer = findContainer(over.id);

    if (!overContainer) {
      setActiveId(null);
      return;
    }

    if (activeContainer === overContainer) {
      const containerItems = items[activeContainer];
      const activeIndex = containerItems.indexOf(active.id as number);
      const overIndex = containerItems.indexOf(over.id as number);

      if (activeIndex !== overIndex) {
        const newItems = {
          ...items,
          [activeContainer]: arrayMove(containerItems, activeIndex, overIndex),
        };
        setItems(newItems);
        submitReorder(newItems);
      } else {
        submitReorder(items);
      }
    } else {
      submitReorder(items);
    }

    setActiveId(null);
  };

  const submitReorder = (currentItems: Items) => {
    const reorderItems: {
      id: number;
      status: MidTermStatus;
      displayOrder: number;
    }[] = [];

    for (const status of STATUSES) {
      currentItems[status].forEach((id, index) => {
        reorderItems.push({ id, status, displayOrder: index });
      });
    }

    reorder.mutate(reorderItems);
  };

  const activeTask = activeId ? taskMap.get(activeId as number) : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      measuring={{
        droppable: { strategy: MeasuringStrategy.Always },
      }}
    >
      <div className="grid grid-cols-3 gap-4 flex-1">
        {STATUSES.map((status) => (
          <DroppableColumn
            key={status}
            status={status}
            taskIds={items[status]}
            taskMap={taskMap}
            onCardClick={onCardClick}
          />
        ))}
      </div>

      <DragOverlay>
        {activeTask && (
          <div className="bg-card border border-primary rounded-lg p-3 shadow-lg opacity-90 rotate-2 cursor-grabbing">
            <div className="text-sm font-medium">{activeTask.name}</div>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
