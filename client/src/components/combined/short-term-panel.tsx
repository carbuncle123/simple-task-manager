import { cn } from "@/lib/utils";

interface ShortTermPanelProps {
  isOpen: boolean;
}

export function ShortTermPanel({ isOpen }: ShortTermPanelProps) {
  return (
    <div
      className={cn(
        "border rounded-lg bg-card overflow-hidden flex flex-col transition-all duration-300 ease-in-out",
        isOpen ? "p-4 border-border" : "p-0 border-transparent"
      )}
    >
      <div className="min-w-[250px]">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-bold">今すぐやる</span>
          <span className="text-xs text-muted-foreground">0件</span>
        </div>

        {/* Placeholder for AddTaskForm (Phase 3) */}
        <div className="flex gap-2 mb-3">
          <div className="flex-1 h-9 rounded-md border border-input bg-background px-3 flex items-center text-sm text-muted-foreground">
            タスクを追加...
          </div>
          <div className="h-9 px-3 rounded-md bg-primary text-primary-foreground text-sm flex items-center font-medium">
            追加
          </div>
        </div>

        {/* Placeholder for TaskList (Phase 3) */}
        <div className="flex-1 flex items-center justify-center h-48 text-muted-foreground text-sm border border-dashed rounded-lg">
          短期タスク（Phase 3 で実装）
        </div>
      </div>
    </div>
  );
}
