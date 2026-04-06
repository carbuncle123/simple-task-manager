import { useRef, useState, useCallback, useEffect } from "react";
import {
  addDays,
  differenceInCalendarDays,
  format,
  startOfWeek,
  isWeekend,
  isSameDay,
} from "date-fns";
import { cn } from "@/lib/utils";
import type { MidTermTask } from "@simple-task-manager/shared";
import { GanttToolbar, type GanttScale } from "./gantt-toolbar";

const TASK_COL_WIDTH = 180;
const DAY_COL_WIDTH = 40;
const WEEK_COL_WIDTH = 80;
const DAY_COUNT = 30;
const WEEK_COUNT = 12;

interface GanttChartProps {
  tasks: MidTermTask[];
  onTaskClick: (task: MidTermTask) => void;
}

export function GanttChart({ tasks, onTaskClick }: GanttChartProps) {
  const today = new Date();
  const [scale, setScale] = useState<GanttScale>("day");
  const [viewStart, setViewStart] = useState(() => addDays(today, -3));
  const containerRef = useRef<HTMLDivElement>(null);

  // Drag scroll state
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const scrollStart = useRef(0);

  const colWidth = scale === "day" ? DAY_COL_WIDTH : WEEK_COL_WIDTH;
  const slotCount = scale === "day" ? DAY_COUNT : WEEK_COUNT;

  // Build slot dates
  const slots: Date[] = [];
  if (scale === "day") {
    for (let i = 0; i < slotCount; i++) slots.push(addDays(viewStart, i));
  } else {
    let ws = startOfWeek(viewStart, { weekStartsOn: 1 });
    for (let i = 0; i < slotCount; i++) {
      slots.push(ws);
      ws = addDays(ws, 7);
    }
  }

  const viewEnd = scale === "day" ? addDays(viewStart, slotCount - 1) : addDays(slots[slots.length - 1], 6);

  // Navigation
  const handlePrev = () =>
    setViewStart((d) => addDays(d, scale === "day" ? -7 : -28));
  const handleNext = () =>
    setViewStart((d) => addDays(d, scale === "day" ? 7 : 28));
  const handleToday = () =>
    setViewStart(scale === "day" ? addDays(today, -3) : startOfWeek(addDays(today, -7), { weekStartsOn: 1 }));
  const handleScaleChange = (s: GanttScale) => {
    setScale(s);
    if (s === "week") setViewStart(startOfWeek(viewStart, { weekStartsOn: 1 }));
  };

  // Drag scroll handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    isDragging.current = true;
    dragStartX.current = e.clientX;
    scrollStart.current = containerRef.current?.scrollLeft ?? 0;
    containerRef.current?.classList.add("cursor-grabbing");
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current || !containerRef.current) return;
    containerRef.current.scrollLeft =
      scrollStart.current - (e.clientX - dragStartX.current);
  }, []);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
    containerRef.current?.classList.remove("cursor-grabbing");
  }, []);

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      isDragging.current = false;
      containerRef.current?.classList.remove("cursor-grabbing");
    };
    document.addEventListener("mouseup", handleGlobalMouseUp);
    return () => document.removeEventListener("mouseup", handleGlobalMouseUp);
  }, []);

  // Bar computation
  const getBar = (task: MidTermTask) => {
    if (!task.deadline) return null;

    const deadline = new Date(task.deadline);
    const start = task.startDate ? new Date(task.startDate) : new Date(viewStart);
    const slotStart = slots[0];
    const slotEnd = scale === "day" ? addDays(slotStart, slotCount) : addDays(slots[slots.length - 1], 7);

    const barStart = start < slotStart ? slotStart : start;
    const barEnd = deadline > slotEnd ? slotEnd : addDays(deadline, 1);

    if (barEnd <= slotStart || barStart >= slotEnd) return null;

    let left: number, width: number;
    if (scale === "day") {
      left = differenceInCalendarDays(barStart, slotStart) * colWidth;
      width = differenceInCalendarDays(barEnd, barStart) * colWidth;
    } else {
      const wsStart = startOfWeek(slotStart, { weekStartsOn: 1 });
      left = (differenceInCalendarDays(barStart, wsStart) / 7) * colWidth;
      width = (differenceInCalendarDays(barEnd, barStart) / 7) * colWidth;
    }

    return { left: Math.max(left, 0), width: Math.max(width, 4) };
  };

  const getBarColor = (task: MidTermTask) => {
    if (task.status === "done") return "bg-green-500";
    if (task.deadline && new Date(task.deadline) < today) return "bg-red-500";
    if (task.status === "in-progress") return "bg-blue-500";
    return "bg-slate-400";
  };

  const getBarLabel = (task: MidTermTask) => {
    const end = task.deadline ? format(new Date(task.deadline), "M/d") : "";
    if (task.startDate) {
      return `${format(new Date(task.startDate), "M/d")}〜${end}`;
    }
    return `〜${end}`;
  };

  // Month groups for header
  const monthGroups: { label: string; span: number }[] = [];
  let i = 0;
  while (i < slots.length) {
    const m = slots[i].getMonth();
    const y = slots[i].getFullYear();
    let span = 0;
    while (i + span < slots.length && slots[i + span].getMonth() === m) span++;
    monthGroups.push({ label: `${y}年${m + 1}月`, span });
    i += span;
  }

  // Today line position
  let todayLineLeft: number | null = null;
  if (scale === "day") {
    const offset = differenceInCalendarDays(today, slots[0]);
    if (offset >= 0 && offset < slotCount) {
      todayLineLeft = TASK_COL_WIDTH + offset * colWidth + colWidth / 2;
    }
  } else {
    const wsStart = startOfWeek(slots[0], { weekStartsOn: 1 });
    const pos = (differenceInCalendarDays(today, wsStart) / 7) * colWidth;
    if (pos >= 0 && pos < slotCount * colWidth) {
      todayLineLeft = TASK_COL_WIDTH + pos;
    }
  }

  // Only show tasks with deadlines
  const ganttTasks = tasks.filter((t) => t.deadline);

  const totalWidth = TASK_COL_WIDTH + slotCount * colWidth;
  const gridCols = `${TASK_COL_WIDTH}px repeat(${slotCount}, ${colWidth}px)`;

  return (
    <div className="flex flex-col flex-1">
      <GanttToolbar
        viewStart={viewStart}
        viewEnd={viewEnd}
        scale={scale}
        onPrev={handlePrev}
        onNext={handleNext}
        onToday={handleToday}
        onScaleChange={handleScaleChange}
      />

      <div
        ref={containerRef}
        className="overflow-x-auto border rounded-lg bg-card cursor-grab select-none flex-1"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <div className="relative" style={{ width: totalWidth }}>
          {/* Month row */}
          <div className="grid sticky top-0 z-10 bg-muted/80 border-b" style={{ gridTemplateColumns: gridCols }}>
            <div className="px-3 py-1 text-xs font-semibold text-muted-foreground border-r" />
            {monthGroups.map((g, idx) => (
              <div
                key={idx}
                className="px-2 py-1 text-xs font-semibold text-muted-foreground border-r border-border/30"
                style={{ gridColumn: `span ${g.span}` }}
              >
                {g.label}
              </div>
            ))}
          </div>

          {/* Date header row */}
          <div className="grid border-b-2 bg-muted/50" style={{ gridTemplateColumns: gridCols }}>
            <div className="px-3 py-1.5 text-xs font-semibold border-r">タスク</div>
            {slots.map((s, idx) => (
              <div
                key={idx}
                className={cn(
                  "text-center text-[10px] py-1.5 border-r border-border/20",
                  scale === "day" && isSameDay(s, today) && "bg-blue-50 text-blue-600 font-semibold",
                  scale === "day" && isWeekend(s) && !isSameDay(s, today) && "bg-muted/80 text-muted-foreground/50"
                )}
              >
                {scale === "day" ? s.getDate() : `${s.getMonth() + 1}/${s.getDate()}`}
              </div>
            ))}
          </div>

          {/* Task rows */}
          {ganttTasks.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
              締切のあるタスクがありません
            </div>
          ) : (
            ganttTasks.map((task) => {
              const bar = getBar(task);
              return (
                <div
                  key={task.id}
                  className="grid border-b border-border/10 min-h-[40px] items-center hover:bg-muted/30 relative"
                  style={{ gridTemplateColumns: gridCols }}
                >
                  <div
                    className="px-3 py-2 text-xs font-medium border-r truncate cursor-pointer hover:text-primary"
                    onClick={() => onTaskClick(task)}
                  >
                    {task.name}
                  </div>
                  {slots.map((s, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        "h-full border-r border-border/5",
                        scale === "day" && isWeekend(s) && "bg-muted/40"
                      )}
                    />
                  ))}
                  {/* Bar overlay */}
                  {bar && (
                    <div
                      className={cn(
                        "absolute top-[10px] h-5 rounded text-[10px] text-white flex items-center px-1.5 whitespace-nowrap overflow-hidden cursor-pointer",
                        getBarColor(task)
                      )}
                      style={{
                        left: TASK_COL_WIDTH + bar.left,
                        width: bar.width,
                      }}
                      onClick={() => onTaskClick(task)}
                    >
                      {getBarLabel(task)}
                    </div>
                  )}
                </div>
              );
            })
          )}

          {/* Today line */}
          {todayLineLeft !== null && (
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20 pointer-events-none"
              style={{ left: todayLineLeft }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
