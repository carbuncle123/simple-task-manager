import { cn } from "@/lib/utils";
import {
  COL_WIDTH_PX,
  buildMonthSegments,
  type DayCell,
} from "@/lib/gantt-date";

interface GanttHeaderProps {
  cells: DayCell[];
  labelWidth: number;
}

const DOW_JA = ["日", "月", "火", "水", "木", "金", "土"];

export function GanttHeader({ cells, labelWidth }: GanttHeaderProps) {
  const segments = buildMonthSegments(cells);

  return (
    <div className="sticky top-0 z-10 bg-white">
      <div className="flex border-b border-slate-200 bg-slate-50">
        <div
          className="flex-shrink-0 border-r border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700"
          style={{ width: labelWidth }}
        >
          プロジェクト / タスク
        </div>
        <div className="flex">
          {segments.map((seg, i) => (
            <div
              key={`${seg.year}-${seg.month}-${i}`}
              className="border-r border-slate-300 bg-slate-50 px-2 py-2 text-xs font-semibold text-slate-700"
              style={{ width: seg.span * COL_WIDTH_PX }}
            >
              {seg.year}年 {seg.month + 1}月
            </div>
          ))}
        </div>
      </div>
      <div className="flex border-b border-slate-200 bg-slate-50/60">
        <div
          className="flex-shrink-0 border-r border-slate-300"
          style={{ width: labelWidth }}
        />
        <div className="flex">
          {cells.map((c, i) => (
            <div
              key={i}
              className={cn(
                "flex flex-col items-center justify-center py-1 border-r border-slate-200",
                c.isWeekend && "bg-slate-100",
                c.isToday && "bg-amber-100"
              )}
              style={{ width: COL_WIDTH_PX }}
            >
              <span className="text-[10px] text-slate-500">
                {DOW_JA[c.date.getDay()]}
              </span>
              <span
                className={cn(
                  "text-[11px]",
                  c.isToday
                    ? "text-red-600 font-bold"
                    : "text-slate-700"
                )}
              >
                {c.date.getDate()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
