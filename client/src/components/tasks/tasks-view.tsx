import { useState, useMemo } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  pointerWithin,
  rectIntersection,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import type { Task } from "@simple-task-manager/shared";
import { useProjects } from "@/hooks/use-projects";
import { useTasks, useReorderTasks, type ReorderItem } from "@/hooks/use-tasks";
import { ProjectColumn } from "./project-column";
import { TaskCard } from "./task-card";

const collisionDetection: CollisionDetection = (args) => {
  const pointer = pointerWithin(args);
  if (pointer.length > 0) return pointer;
  const rect = rectIntersection(args);
  if (rect.length > 0) return rect;
  return closestCorners(args);
};

export function TasksView() {
  const projectsQuery = useProjects();
  const tasksQuery = useTasks();
  const reorder = useReorderTasks();

  const projects = projectsQuery.data ?? [];
  const tasks = tasksQuery.data ?? [];

  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [localTasks, setLocalTasks] = useState<Task[] | null>(null);

  const displayTasks = localTasks ?? tasks;

  const tasksByProject = useMemo(() => {
    const map = new Map<number, Task[]>();
    for (const project of projects) map.set(project.id, []);
    for (const task of displayTasks) {
      if (!map.has(task.projectId)) map.set(task.projectId, []);
      map.get(task.projectId)!.push(task);
    }
    for (const arr of map.values()) {
      arr.sort((a, b) => a.displayOrder - b.displayOrder);
    }
    return map;
  }, [projects, displayTasks]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const findTargetProjectId = (overId: string | number): number | null => {
    if (typeof overId === "string" && overId.startsWith("column-")) {
      return Number(overId.replace("column-", ""));
    }
    if (typeof overId === "number") {
      return displayTasks.find((t) => t.id === overId)?.projectId ?? null;
    }
    return null;
  };

  const handleDragStart = (event: DragStartEvent) => {
    const task = displayTasks.find((t) => t.id === event.active.id);
    if (task) {
      setActiveTask(task);
      setLocalTasks([...displayTasks]);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over || !localTasks) return;

    const activeId = active.id as number;
    const activeTaskItem = localTasks.find((t) => t.id === activeId);
    if (!activeTaskItem) return;

    const targetProjectId = findTargetProjectId(over.id as string | number);
    if (targetProjectId === null) return;

    if (activeTaskItem.projectId !== targetProjectId) {
      setLocalTasks((prev) =>
        prev?.map((t) =>
          t.id === activeId
            ? { ...t, projectId: targetProjectId, displayOrder: 9999 }
            : t
        ) ?? null
      );
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!localTasks || !over) {
      setActiveTask(null);
      setLocalTasks(null);
      return;
    }

    const activeId = active.id as number;
    const overId = over.id as string | number;

    const activeTaskItem = localTasks.find((t) => t.id === activeId);
    if (!activeTaskItem) {
      setActiveTask(null);
      setLocalTasks(null);
      return;
    }

    const targetProjectId = findTargetProjectId(overId);
    if (targetProjectId === null) {
      setActiveTask(null);
      setLocalTasks(null);
      return;
    }

    const targetColumnTasks = localTasks
      .filter((t) => t.projectId === targetProjectId && t.id !== activeId)
      .sort((a, b) => a.displayOrder - b.displayOrder);

    let insertIndex = targetColumnTasks.length;
    if (typeof overId === "number") {
      const overIndex = targetColumnTasks.findIndex((t) => t.id === overId);
      if (overIndex !== -1) insertIndex = overIndex;
    }

    const reorderedTargetColumn = [...targetColumnTasks];
    reorderedTargetColumn.splice(insertIndex, 0, {
      ...activeTaskItem,
      projectId: targetProjectId,
    });

    const sourceProjectId = activeTaskItem.projectId;
    const items: ReorderItem[] = [];

    reorderedTargetColumn.forEach((t, i) => {
      items.push({ id: t.id, projectId: targetProjectId, displayOrder: i });
    });

    if (sourceProjectId !== targetProjectId) {
      const sourceColumnTasks = localTasks
        .filter((t) => t.projectId === sourceProjectId && t.id !== activeId)
        .sort((a, b) => a.displayOrder - b.displayOrder);
      sourceColumnTasks.forEach((t, i) => {
        items.push({ id: t.id, projectId: sourceProjectId, displayOrder: i });
      });
    }

    reorder.mutate(items);
    setActiveTask(null);
    setLocalTasks(null);
  };

  if (projects.length === 0) {
    return (
      <div className="bg-white border border-dashed border-slate-300 rounded-lg p-12 text-center">
        <p className="text-sm font-medium text-slate-900">
          プロジェクトがありません
        </p>
        <p className="text-xs text-slate-500 mt-1">
          設定タブで最初のプロジェクトを追加してください
        </p>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="overflow-x-auto -mx-4 md:-mx-6 px-4 md:px-6 pb-4">
        <div className="flex gap-4 min-h-full">
          {projects.map((project) => (
            <ProjectColumn
              key={project.id}
              project={project}
              tasks={tasksByProject.get(project.id) ?? []}
            />
          ))}
        </div>
      </div>
      <DragOverlay>
        {activeTask ? <TaskCard task={activeTask} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
