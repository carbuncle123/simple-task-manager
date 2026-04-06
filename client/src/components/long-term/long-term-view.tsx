import { useState } from "react";
import { ChevronDown, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import type { LongTermTask } from "@simple-task-manager/shared";
import { useLongTermTasks, useDeleteLongTermTask } from "@/hooks/use-long-term-tasks";
import { LongTermTaskDialog } from "./long-term-task-dialog";

export function LongTermView() {
  const { data: tasks = [], isLoading } = useLongTermTasks();
  const deleteTask = useDeleteLongTermTask();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<LongTermTask | null>(null);
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set());

  // Group tasks by category
  const grouped = new Map<string, LongTermTask[]>();
  for (const task of tasks) {
    const cat = task.category || "未分類";
    if (!grouped.has(cat)) grouped.set(cat, []);
    grouped.get(cat)!.push(task);
  }

  const toggleCategory = (cat: string) => {
    setOpenCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  // Open all categories by default on first load
  if (openCategories.size === 0 && grouped.size > 0) {
    const all = new Set(grouped.keys());
    setOpenCategories(all);
  }

  const handleAdd = () => {
    setEditingTask(null);
    setDialogOpen(true);
  };

  const handleEdit = (task: LongTermTask) => {
    setEditingTask(task);
    setDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
        読み込み中...
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <span className="text-base font-semibold">長期タスク</span>
        <Button size="sm" onClick={handleAdd}>
          + タスク追加
        </Button>
      </div>

      {grouped.size === 0 ? (
        <div className="flex items-center justify-center h-48 text-muted-foreground text-sm border border-dashed rounded-lg">
          タスクがありません
        </div>
      ) : (
        <div className="space-y-3">
          {[...grouped.entries()].map(([category, categoryTasks]) => (
            <Collapsible
              key={category}
              open={openCategories.has(category)}
              onOpenChange={() => toggleCategory(category)}
            >
              <div className="border rounded-lg overflow-hidden">
                <CollapsibleTrigger className="flex items-center justify-between w-full px-4 py-3 bg-muted/50 hover:bg-muted transition-colors text-left">
                  <span className="text-sm font-semibold">{category}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {categoryTasks.length}件
                    </span>
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 text-muted-foreground transition-transform",
                        openCategories.has(category) && "rotate-180"
                      )}
                    />
                  </div>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  {categoryTasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between px-4 py-3 border-t hover:bg-muted/30 transition-colors group"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium">{task.name}</div>
                        {task.memo && (
                          <div className="text-xs text-muted-foreground mt-0.5 truncate">
                            {task.memo}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleEdit(task)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => deleteTask.mutate(task.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </CollapsibleContent>
              </div>
            </Collapsible>
          ))}
        </div>
      )}

      <LongTermTaskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        task={editingTask}
      />
    </div>
  );
}
