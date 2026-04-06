import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type { LongTermTask } from "@simple-task-manager/shared";
import {
  useCreateLongTermTask,
  useUpdateLongTermTask,
  useDeleteLongTermTask,
  useLongTermCategories,
} from "@/hooks/use-long-term-tasks";

interface LongTermTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: LongTermTask | null;
}

export function LongTermTaskDialog({
  open,
  onOpenChange,
  task,
}: LongTermTaskDialogProps) {
  const isEdit = !!task;

  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [memo, setMemo] = useState("");

  const { data: categories = [] } = useLongTermCategories();
  const createTask = useCreateLongTermTask();
  const updateTask = useUpdateLongTermTask();
  const deleteTask = useDeleteLongTermTask();

  useEffect(() => {
    if (task) {
      setName(task.name);
      setCategory(task.category);
      setMemo(task.memo);
    } else {
      setName("");
      setCategory("");
      setMemo("");
    }
  }, [task, open]);

  const handleSubmit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;

    if (isEdit && task) {
      updateTask.mutate(
        { id: task.id, data: { name: trimmed, category: category || undefined, memo } },
        { onSuccess: () => onOpenChange(false) }
      );
    } else {
      createTask.mutate(
        { name: trimmed, category: category || undefined, memo: memo || undefined },
        { onSuccess: () => onOpenChange(false) }
      );
    }
  };

  const handleDelete = () => {
    if (task) {
      deleteTask.mutate(task.id, { onSuccess: () => onOpenChange(false) });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "タスクを編集" : "長期タスクを追加"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 mt-2">
          <div>
            <label className="text-sm font-medium mb-1 block">タスク名</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="タスク名を入力"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">カテゴリ</label>
            <Input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="例: アーキテクチャ, 学習, アイデア"
              list="long-term-categories"
            />
            <datalist id="long-term-categories">
              {categories.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">メモ</label>
            <Textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="メモを入力..."
              className="min-h-[80px]"
            />
          </div>

          <div className="flex justify-between pt-2">
            <div>
              {isEdit && (
                <Button variant="destructive" size="sm" onClick={handleDelete}>
                  削除
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                キャンセル
              </Button>
              <Button onClick={handleSubmit}>
                {isEdit ? "保存" : "追加"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
