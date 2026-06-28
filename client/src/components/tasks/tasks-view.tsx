import { useEffect, useMemo, useState } from "react";
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
import type { Project, Task } from "@simple-task-manager/shared";
import { Skeleton } from "@/components/ui/skeleton";
import { useProjects } from "@/hooks/use-projects";
import { useReorderTasks, useTasks, type ReorderItem } from "@/hooks/use-tasks";
import { ProjectColumn } from "./project-column";
import { TaskDetailPane } from "./task-detail-pane";

function TasksViewSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_380px]">
      <div className="space-y-4">
        {[0, 1, 2].map((index) => (
          <div key={index} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <Skeleton className="h-5 w-44" />
            <Skeleton className="mt-4 h-9 w-full" />
            <div className="mt-4 space-y-3">
              {[0, 1].map((taskIndex) => (
                <Skeleton key={taskIndex} className="h-28 w-full rounded-xl" />
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <Skeleton className="h-6 w-28" />
        <Skeleton className="mt-4 h-10 w-full" />
        <Skeleton className="mt-4 h-10 w-full" />
        <Skeleton className="mt-4 h-40 w-full" />
      </div>
    </div>
  );
}

const collisionDetection: CollisionDetection = (args) => {
  const pointer = pointerWithin(args);
  if (pointer.length > 0) return pointer;
  const rect = rectIntersection(args);
  if (rect.length > 0) return rect;
  return closestCorners(args);
};

function buildOrderedTasks(projects: Project[], tasks: Task[]) {
  const tasksByProject = new Map<number, Task[]>();
  for (const project of projects) tasksByProject.set(project.id, []);
  for (const task of tasks) {
    if (!tasksByProject.has(task.projectId)) tasksByProject.set(task.projectId, []);
    tasksByProject.get(task.projectId)!.push(task);
  }
  for (const projectTasks of tasksByProject.values()) {
    projectTasks.sort((a, b) => a.displayOrder - b.displayOrder);
  }

  const ordered: Task[] = [];
  for (const project of projects) {
    ordered.push(...(tasksByProject.get(project.id) ?? []));
  }
  return { tasksByProject, ordered };
}

function findFallbackTaskId(projects: Project[], tasks: Task[], deletedTaskId: number) {
  const { ordered } = buildOrderedTasks(projects, tasks);
  const currentIndex = ordered.findIndex((task) => task.id === deletedTaskId);
  if (currentIndex === -1) return ordered[0]?.id ?? null;

  const deletedTask = ordered[currentIndex];
  const sameProject = ordered.filter(
    (task) => task.projectId === deletedTask.projectId && task.id !== deletedTaskId
  );
  if (sameProject.length > 0) {
    const nextInProject = sameProject.find((task) => task.displayOrder >= deletedTask.displayOrder);
    return nextInProject?.id ?? sameProject[sameProject.length - 1].id;
  }

  const withoutDeleted = ordered.filter((task) => task.id !== deletedTaskId);
  return withoutDeleted[currentIndex]?.id ?? withoutDeleted[currentIndex - 1]?.id ?? null;
}

function TaskDragOverlay({ task }: { task: Task | null }) {
  if (!task) return null;

  return (
    <div className="w-[min(100%,520px)] rounded-xl border border-blue-200 bg-white p-4 shadow-lg">
      <p className="text-sm font-medium leading-6 text-slate-900 whitespace-pre-wrap break-words">
        {task.name}
      </p>
    </div>
  );
}

export function TasksView() {
  const projectsQuery = useProjects();
  const tasksQuery = useTasks();
  const reorder = useReorderTasks();

  const projects = projectsQuery.data ?? [];
  const tasks = tasksQuery.data ?? [];

  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [localTasks, setLocalTasks] = useState<Task[] | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [openProjects, setOpenProjects] = useState<Set<number>>(new Set());

  const displayTasks = localTasks ?? tasks;

  const { tasksByProject, ordered: orderedTasks } = useMemo(
    () => buildOrderedTasks(projects, displayTasks),
    [displayTasks, projects]
  );

  const selectedTask = displayTasks.find((task) => task.id === selectedTaskId) ?? null;
  const selectedProject =
    projects.find((project) => project.id === selectedTask?.projectId) ?? null;

  useEffect(() => {
    if (displayTasks.length === 0) {
      if (selectedTaskId !== null) setSelectedTaskId(null);
      return;
    }

    const exists = displayTasks.some((task) => task.id === selectedTaskId);
    if (!exists) {
      setSelectedTaskId(orderedTasks[0]?.id ?? null);
    }
  }, [displayTasks, orderedTasks, selectedTaskId]);

  useEffect(() => {
    if (!selectedTask) return;
    setOpenProjects((prev) => {
      if (prev.has(selectedTask.projectId)) return prev;
      const next = new Set(prev);
      next.add(selectedTask.projectId);
      return next;
    });
  }, [selectedTask]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const findTargetProjectId = (overId: string | number): number | null => {
    if (typeof overId === "string" && overId.startsWith("column-")) {
      return Number(overId.replace("column-", ""));
    }
    if (typeof overId === "number") {
      return displayTasks.find((task) => task.id === overId)?.projectId ?? null;
    }
    return null;
  };

  const handleDragStart = (event: DragStartEvent) => {
    const task = displayTasks.find((item) => item.id === event.active.id);
    if (task) {
      setActiveTask(task);
      setLocalTasks([...displayTasks]);
      setSelectedTaskId(task.id);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over || !localTasks) return;

    const activeId = active.id as number;
    const activeTaskItem = localTasks.find((task) => task.id === activeId);
    if (!activeTaskItem) return;

    const targetProjectId = findTargetProjectId(over.id as string | number);
    if (targetProjectId === null) return;

    if (activeTaskItem.projectId !== targetProjectId) {
      setLocalTasks((prev) =>
        prev?.map((task) =>
          task.id === activeId
            ? { ...task, projectId: targetProjectId, displayOrder: 9999 }
            : task
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
    const activeTaskItem = localTasks.find((task) => task.id === activeId);

    if (!activeTaskItem) {
      setActiveTask(null);
      setLocalTasks(null);
      return;
    }

    const sourceProjectId = tasks.find((task) => task.id === activeId)?.projectId ?? activeTaskItem.projectId;
    const targetProjectId = findTargetProjectId(overId);
    if (targetProjectId === null) {
      setActiveTask(null);
      setLocalTasks(null);
      return;
    }

    const targetColumnTasks = localTasks
      .filter((task) => task.projectId === targetProjectId && task.id !== activeId)
      .sort((a, b) => a.displayOrder - b.displayOrder);

    let insertIndex = targetColumnTasks.length;
    if (typeof overId === "number") {
      const overIndex = targetColumnTasks.findIndex((task) => task.id === overId);
      if (overIndex !== -1) insertIndex = overIndex;
    }

    const reorderedTargetColumn = [...targetColumnTasks];
    reorderedTargetColumn.splice(insertIndex, 0, {
      ...activeTaskItem,
      projectId: targetProjectId,
    });

    const items: ReorderItem[] = [];
    reorderedTargetColumn.forEach((task, index) => {
      items.push({ id: task.id, projectId: targetProjectId, displayOrder: index });
    });

    if (sourceProjectId !== targetProjectId) {
      const sourceColumnTasks = localTasks
        .filter((task) => task.projectId === sourceProjectId && task.id !== activeId)
        .sort((a, b) => a.displayOrder - b.displayOrder);
      sourceColumnTasks.forEach((task, index) => {
        items.push({ id: task.id, projectId: sourceProjectId, displayOrder: index });
      });
    }

    reorder.mutate(items);
    setSelectedTaskId(activeId);
    setActiveTask(null);
    setLocalTasks(null);
  };

  const handleTaskDeleted = (taskId: number) => {
    if (selectedTaskId !== taskId) return;
    setSelectedTaskId(findFallbackTaskId(projects, tasks, taskId));
  };

  if (projectsQuery.isLoading || tasksQuery.isLoading) {
    return <TasksViewSkeleton />;
  }

  if (projects.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-white p-12 text-center">
        <p className="text-sm font-medium text-slate-900">プロジェクトがありません</p>
        <p className="mt-1 text-xs text-slate-500">
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
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_380px]">
        <div className="space-y-4 xl:max-h-[calc(100vh-180px)] xl:overflow-y-auto xl:pr-1">
          {projects.map((project) => (
            <ProjectColumn
              key={project.id}
              project={project}
              tasks={tasksByProject.get(project.id) ?? []}
              open={openProjects.has(project.id)}
              onOpenChange={(open) =>
                setOpenProjects((prev) => {
                  const next = new Set(prev);
                  if (open) next.add(project.id);
                  else next.delete(project.id);
                  return next;
                })
              }
              onSelectTask={setSelectedTaskId}
              onTaskDeleted={handleTaskDeleted}
              selectedTaskId={selectedTaskId}
            />
          ))}
        </div>

        <TaskDetailPane
          task={selectedTask}
          project={selectedProject}
          onDeleted={handleTaskDeleted}
        />
      </div>

      <DragOverlay>
        <TaskDragOverlay task={activeTask} />
      </DragOverlay>
    </DndContext>
  );
}
