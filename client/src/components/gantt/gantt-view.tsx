import { useState, useMemo } from "react";
import {
  COL_WIDTH_PX,
  LEAD_DAYS_BEFORE_TODAY,
  TOTAL_COLUMNS,
  addDays,
  buildDayCells,
  diffDays,
  startOfWeek,
  todayJST,
  type GanttScale,
} from "@/lib/gantt-date";
import { useProjects } from "@/hooks/use-projects";
import { useTasks } from "@/hooks/use-tasks";
import type { Task } from "@simple-task-manager/shared";
import { Skeleton } from "@/components/ui/skeleton";
import { GanttToolbar } from "./gantt-toolbar";
import { GanttHeader } from "./gantt-header";
import { GanttProjectRow } from "./gantt-project-row";

function GanttViewSkeleton() {
  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
      <div className="px-4 py-2.5 border-b border-slate-200 flex items-center gap-3">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-8 w-24 ml-2" />
      </div>
      <div className="p-4 space-y-2">
        {[0, 1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-9 w-full" />
        ))}
      </div>
    </div>
  );
}

const LABEL_WIDTH = 220;

const initialViewStart = (scale: GanttScale): Date => {
  const today = todayJST();
  if (scale === "week") {
    return addDays(startOfWeek(today), -7);
  }
  return addDays(today, -LEAD_DAYS_BEFORE_TODAY);
};

export function GanttView() {
  const projectsQuery = useProjects();
  const tasksQuery = useTasks();
  const projects = projectsQuery.data ?? [];
  const tasks = tasksQuery.data ?? [];

  const [scale, setScale] = useState<GanttScale>("day");
  const [viewStart, setViewStart] = useState<Date>(() => initialViewStart("day"));

  const cells = useMemo(() => {
    if (scale === "week") {
      const dayCells = [] as ReturnType<typeof buildDayCells>;
      for (let i = 0; i < TOTAL_COLUMNS; i++) {
        const d = addDays(viewStart, i * 7);
        const cells7 = buildDayCells(d, 1);
        dayCells.push(cells7[0]);
      }
      return dayCells;
    }
    return buildDayCells(viewStart, TOTAL_COLUMNS);
  }, [viewStart, scale]);

  const tasksByProject = useMemo(() => {
    const map = new Map<number, Task[]>();
    for (const p of projects) map.set(p.id, []);
    for (const t of tasks) {
      if (!map.has(t.projectId)) map.set(t.projectId, []);
      map.get(t.projectId)!.push(t);
    }
    for (const arr of map.values()) {
      arr.sort((a, b) => a.displayOrder - b.displayOrder);
    }
    return map;
  }, [projects, tasks]);

  const handlePrev = () =>
    setViewStart((d) => addDays(d, scale === "week" ? -7 * 7 : -7));
  const handleNext = () =>
    setViewStart((d) => addDays(d, scale === "week" ? 7 * 7 : 7));
  const handleJumpToday = () => setViewStart(initialViewStart(scale));

  const handleScaleChange = (next: GanttScale) => {
    setScale(next);
    setViewStart(initialViewStart(next));
  };

  const today = todayJST();
  const todayDays = diffDays(viewStart, today);
  const pxPerDay = scale === "day" ? COL_WIDTH_PX : COL_WIDTH_PX / 7;
  const todayLeftPx = todayDays * pxPerDay + (scale === "day" ? COL_WIDTH_PX / 2 : 0);
  const showTodayLine = todayDays >= 0 && todayDays < TOTAL_COLUMNS * (scale === "week" ? 7 : 1);

  if (projectsQuery.isLoading || tasksQuery.isLoading) {
    return <GanttViewSkeleton />;
  }

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
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
      <GanttToolbar
        scale={scale}
        onScaleChange={handleScaleChange}
        onPrev={handlePrev}
        onNext={handleNext}
        onJumpToday={handleJumpToday}
      />
      <div className="overflow-x-auto">
        <div
          className="relative"
          style={{ width: LABEL_WIDTH + cells.length * COL_WIDTH_PX }}
        >
          <GanttHeader cells={cells} labelWidth={LABEL_WIDTH} />
          <div className="relative">
            {projects.map((project) => (
              <GanttProjectRow
                key={project.id}
                project={project}
                tasks={tasksByProject.get(project.id) ?? []}
                cells={cells}
                viewStart={viewStart}
                scale={scale}
                labelWidth={LABEL_WIDTH}
              />
            ))}
            {showTodayLine && (
              <div
                className="absolute top-0 bottom-0 w-[2px] bg-red-500 pointer-events-none z-[5]"
                style={{ left: LABEL_WIDTH + todayLeftPx }}
              >
                <span className="absolute -top-5 left-1/2 -translate-x-1/2 bg-red-500 text-white text-[10px] px-1.5 rounded-full whitespace-nowrap">
                  今日
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
