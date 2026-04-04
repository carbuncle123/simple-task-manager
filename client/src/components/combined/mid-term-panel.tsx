import { useState } from "react";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { MidTermTask } from "@simple-task-manager/shared";
import { KanbanBoard } from "@/components/mid-term/kanban-board";
import { GanttChart } from "@/components/gantt/gantt-chart";
import { MidTermTaskDialog } from "@/components/mid-term/mid-term-task-dialog";
import { useMidTermTasks } from "@/hooks/use-mid-term-tasks";

type ViewMode = "kanban" | "gantt";

interface MidTermPanelProps {
  isLeftOpen: boolean;
  onToggleLeft: () => void;
}

export function MidTermPanel({ isLeftOpen, onToggleLeft }: MidTermPanelProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("kanban");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<MidTermTask | null>(null);

  const { data: tasks = [], isLoading } = useMidTermTasks();

  const handleAddClick = () => {
    setEditingTask(null);
    setDialogOpen(true);
  };

  const handleCardClick = (task: MidTermTask) => {
    setEditingTask(task);
    setDialogOpen(true);
  };

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

        <div className="flex gap-0.5 bg-muted rounded-lg p-0.5">
          <button
            className={cn(
              "px-3 py-1 rounded-md text-sm font-medium transition-all",
              viewMode === "kanban"
                ? "bg-background shadow-sm"
                : "text-muted-foreground"
            )}
            onClick={() => setViewMode("kanban")}
          >
            カンバン
          </button>
          <button
            className={cn(
              "px-3 py-1 rounded-md text-sm font-medium transition-all",
              viewMode === "gantt"
                ? "bg-background shadow-sm"
                : "text-muted-foreground"
            )}
            onClick={() => setViewMode("gantt")}
          >
            ガントチャート
          </button>
        </div>

        <div className="ml-auto">
          <Button size="sm" onClick={handleAddClick}>
            + タスク追加
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
          読み込み中...
        </div>
      ) : viewMode === "kanban" ? (
        <KanbanBoard tasks={tasks} onCardClick={handleCardClick} />
      ) : (
        <GanttChart tasks={tasks} onTaskClick={handleCardClick} />
      )}

      <MidTermTaskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        task={editingTask}
      />
    </div>
  );
}
