import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface MidTermPanelProps {
  isLeftOpen: boolean;
  onToggleLeft: () => void;
}

export function MidTermPanel({ isLeftOpen, onToggleLeft }: MidTermPanelProps) {
  return (
    <div className="flex flex-col overflow-hidden">
      <div className="flex items-center gap-3 mb-3">
        <button
          onClick={onToggleLeft}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-sm font-semibold hover:bg-accent transition-colors"
        >
          <ChevronLeft
            className={cn(
              "h-3.5 w-3.5 transition-transform duration-300",
              !isLeftOpen && "rotate-180"
            )}
          />
          <span>今すぐやる</span>
        </button>

        {/* View toggle placeholder */}
        <div className="flex gap-0.5 bg-muted rounded-lg p-0.5">
          <div className="px-3 py-1 rounded-md bg-background text-sm font-medium shadow-sm">
            カンバン
          </div>
          <div className="px-3 py-1 rounded-md text-sm font-medium text-muted-foreground">
            ガントチャート
          </div>
        </div>

        <div className="ml-auto">
          <div className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-sm flex items-center font-medium">
            + タスク追加
          </div>
        </div>
      </div>

      {/* Placeholder for Kanban/Gantt (Phase 4/5) */}
      <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm border border-dashed rounded-lg">
        中期タスク（Phase 4/5 で実装）
      </div>
    </div>
  );
}
