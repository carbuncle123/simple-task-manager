import { cn } from "@/lib/utils";
import { COL_WIDTH_PX, diffDays, parseYMD, todayJST } from "@/lib/gantt-date";
import type { Task } from "@simple-task-manager/shared";
import type { GanttScale } from "@/lib/gantt-date";

interface GanttBarProps {
  task: Task;
  viewStart: Date;
  scale: GanttScale;
}

export function GanttBar({ task, viewStart, scale }: GanttBarProps) {
  const today = todayJST();
  const deadline = parseYMD(task.deadline);
  const daysFromStart = diffDays(viewStart, deadline);
  const pxPerDay = scale === "day" ? COL_WIDTH_PX : COL_WIDTH_PX / 7;
  const width = Math.max(0, (daysFromStart + 1) * pxPerDay - 4);

  if (width <= 0) return null;

  const isOverdue = deadline.getTime() < today.getTime();
  const isInProgress = task.status === "in-progress";

  const colorClass = isOverdue
    ? "bg-red-200 text-red-900 border-red-400"
    : isInProgress
      ? "bg-sky-500 text-white border-sky-600"
      : "bg-slate-200 text-slate-700 border-slate-300";

  return (
    <div
      className={cn(
        "absolute h-[22px] rounded-full flex items-center px-3 text-[11px] whitespace-nowrap overflow-hidden border shadow-sm",
        colorClass
      )}
      style={{
        left: 0,
        top: 7,
        width,
        textOverflow: "ellipsis",
      }}
      title={`${task.name} (締切: ${task.deadline})`}
    >
      <span className="truncate">{task.name}</span>
      <span
        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-2.5 h-2.5 rounded-full"
        style={{ background: "currentColor" }}
        aria-hidden
      />
    </div>
  );
}
