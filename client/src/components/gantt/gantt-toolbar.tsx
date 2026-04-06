import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

export type GanttScale = "day" | "week";

interface GanttToolbarProps {
  viewStart: Date;
  viewEnd: Date;
  scale: GanttScale;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onScaleChange: (scale: GanttScale) => void;
}

export function GanttToolbar({
  viewStart,
  viewEnd,
  scale,
  onPrev,
  onNext,
  onToday,
  onScaleChange,
}: GanttToolbarProps) {
  const periodLabel =
    viewStart.getMonth() === viewEnd.getMonth()
      ? format(viewStart, "yyyy年M月", { locale: ja })
      : `${format(viewStart, "yyyy年M月", { locale: ja })} 〜 ${format(viewEnd, "yyyy年M月", { locale: ja })}`;

  return (
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" className="h-7 w-7" onClick={onPrev}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-semibold min-w-[140px] text-center">
          {periodLabel}
        </span>
        <Button variant="outline" size="icon" className="h-7 w-7" onClick={onNext}>
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" className="h-7 ml-2 text-xs" onClick={onToday}>
          今日
        </Button>
      </div>

      <div className="flex gap-0.5 bg-muted rounded-lg p-0.5">
        <button
          className={cn(
            "px-3 py-1 rounded-md text-xs font-medium transition-all",
            scale === "day" ? "bg-background shadow-sm" : "text-muted-foreground"
          )}
          onClick={() => onScaleChange("day")}
        >
          日
        </button>
        <button
          className={cn(
            "px-3 py-1 rounded-md text-xs font-medium transition-all",
            scale === "week" ? "bg-background shadow-sm" : "text-muted-foreground"
          )}
          onClick={() => onScaleChange("week")}
        >
          週
        </button>
      </div>
    </div>
  );
}
