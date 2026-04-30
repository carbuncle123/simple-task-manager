import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { GanttScale } from "@/lib/gantt-date";

interface GanttToolbarProps {
  scale: GanttScale;
  onScaleChange: (scale: GanttScale) => void;
  onPrev: () => void;
  onNext: () => void;
  onJumpToday: () => void;
}

export function GanttToolbar({
  scale,
  onScaleChange,
  onPrev,
  onNext,
  onJumpToday,
}: GanttToolbarProps) {
  return (
    <div className="bg-white border-b border-slate-200 px-4 py-2.5 flex items-center gap-3">
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="sm" className="w-8 h-8 p-0" onClick={onPrev} aria-label="前へ">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </Button>
        <Button variant="ghost" size="sm" className="w-8 h-8 p-0" onClick={onNext} aria-label="次へ">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </Button>
        <Button variant="ghost" size="sm" className="ml-2" onClick={onJumpToday}>
          今日
        </Button>
      </div>
      <div className="ml-2 flex bg-slate-100 rounded-md p-0.5 text-sm">
        <button
          type="button"
          onClick={() => onScaleChange("day")}
          className={cn(
            "px-3 py-1 rounded transition",
            scale === "day"
              ? "bg-white shadow-sm font-medium text-slate-900"
              : "text-slate-600 hover:text-slate-900"
          )}
        >
          日
        </button>
        <button
          type="button"
          onClick={() => onScaleChange("week")}
          className={cn(
            "px-3 py-1 rounded transition",
            scale === "week"
              ? "bg-white shadow-sm font-medium text-slate-900"
              : "text-slate-600 hover:text-slate-900"
          )}
        >
          週
        </button>
      </div>
      <div className="ml-auto flex items-center gap-4 text-xs text-slate-600">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-slate-200 border border-slate-300" />
          対応前
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-sky-500" />
          対応中
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-red-300 border border-red-400" />
          超過
        </span>
      </div>
    </div>
  );
}
