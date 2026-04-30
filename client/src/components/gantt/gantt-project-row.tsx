import type { Project, Task } from "@simple-task-manager/shared";
import { cn } from "@/lib/utils";
import {
  COL_WIDTH_PX,
  type DayCell,
  type GanttScale,
} from "@/lib/gantt-date";
import { GanttBar } from "./gantt-bar";

interface GanttProjectRowProps {
  project: Project;
  tasks: Task[];
  cells: DayCell[];
  viewStart: Date;
  scale: GanttScale;
  labelWidth: number;
}

const ROW_HEIGHT = 36;
const PROJECT_HEADER_HEIGHT = 30;

interface BackgroundCellsProps {
  cells: DayCell[];
  height: number;
}

function BackgroundCells({ cells, height }: BackgroundCellsProps) {
  return (
    <div className="flex absolute inset-0 pointer-events-none">
      {cells.map((c, i) => (
        <div
          key={i}
          style={{ width: COL_WIDTH_PX, height }}
          className={cn(
            "border-r border-slate-100 h-full",
            c.isWeekend && "bg-slate-50",
            c.isToday && "bg-amber-50"
          )}
        />
      ))}
    </div>
  );
}

export function GanttProjectRow({
  project,
  tasks,
  cells,
  viewStart,
  scale,
  labelWidth,
}: GanttProjectRowProps) {
  return (
    <>
      <div
        className="flex border-b border-slate-200 bg-slate-100/60"
        style={{ height: PROJECT_HEADER_HEIGHT }}
      >
        <div
          className="flex-shrink-0 border-r border-slate-300 px-4 flex items-center"
          style={{ width: labelWidth }}
        >
          <span className="text-xs font-semibold text-slate-900 truncate">
            {project.name}
          </span>
          <span className="ml-2 text-[10px] text-slate-500 flex-shrink-0">
            ({tasks.length})
          </span>
        </div>
        <div className="relative" style={{ width: cells.length * COL_WIDTH_PX }}>
          <BackgroundCells cells={cells} height={PROJECT_HEADER_HEIGHT} />
        </div>
      </div>

      {tasks.length === 0 ? (
        <div
          className="flex border-b border-slate-200"
          style={{ height: ROW_HEIGHT }}
        >
          <div
            className="flex-shrink-0 border-r border-slate-300 px-4 flex items-center text-xs text-slate-400"
            style={{ width: labelWidth }}
          >
            タスクなし
          </div>
          <div
            className="relative"
            style={{ width: cells.length * COL_WIDTH_PX }}
          >
            <BackgroundCells cells={cells} height={ROW_HEIGHT} />
          </div>
        </div>
      ) : (
        tasks.map((task) => (
          <div
            key={task.id}
            className="flex border-b border-slate-100 hover:bg-slate-50/60"
            style={{ height: ROW_HEIGHT }}
          >
            <div
              className="flex-shrink-0 border-r border-slate-300 px-4 flex items-center text-xs text-slate-700"
              style={{ width: labelWidth }}
            >
              <span className="truncate">{task.name}</span>
            </div>
            <div
              className="relative"
              style={{ width: cells.length * COL_WIDTH_PX }}
            >
              <BackgroundCells cells={cells} height={ROW_HEIGHT} />
              <GanttBar task={task} viewStart={viewStart} scale={scale} />
            </div>
          </div>
        ))
      )}
    </>
  );
}
