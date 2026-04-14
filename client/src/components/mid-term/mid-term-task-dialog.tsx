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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { MidTermTask, MidTermStatus } from "@simple-task-manager/shared";
import {
  useCreateMidTermTask,
  useUpdateMidTermTask,
  useDeleteMidTermTask,
} from "@/hooks/use-mid-term-tasks";

interface MidTermTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: MidTermTask | null;
}

export function MidTermTaskDialog({
  open,
  onOpenChange,
  task,
}: MidTermTaskDialogProps) {
  const isEdit = !!task;

  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [startDate, setStartDate] = useState("");
  const [deadline, setDeadline] = useState("");
  const [status, setStatus] = useState<MidTermStatus>("todo");
  const [memo, setMemo] = useState("");

  const createTask = useCreateMidTermTask();
  const updateTask = useUpdateMidTermTask();
  const deleteTask = useDeleteMidTermTask();

  useEffect(() => {
    if (task) {
      setName(task.name);
      setCategory(task.category);
      setStartDate(task.startDate ?? "");
      setDeadline(task.deadline ?? "");
      setStatus(task.status);
      setMemo(task.memo);
    } else {
      setName("");
      setCategory("");
      setStartDate("");
      setDeadline("");
      setStatus("todo");
      setMemo("");
    }
  }, [task, open]);

  const handleSubmit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;

    if (isEdit && task) {
      updateTask.mutate(
        {
          id: task.id,
          data: {
            name: trimmed,
            category,
            startDate: startDate || null,
            deadline: deadline || null,
            status,
            memo,
          },
        },
        { onSuccess: () => onOpenChange(false) }
      );
    } else {
      createTask.mutate(
        {
          name: trimmed,
          category: category || undefined,
          startDate: startDate || undefined,
          deadline: deadline || undefined,
          memo: memo || undefined,
        },
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
      <DialogContent className="sm:max-w-[420px] max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "タスクを編集" : "中期タスクを追加"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 mt-2 overflow-y-auto min-h-0 pr-1">
          <div>
            <label className="text-sm font-medium mb-1 block">タスク名</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="タスク名を入力"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">
              カテゴリ
            </label>
            <Input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="例: 開発, 設計, テスト"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-1 block">開始日</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">締切</label>
              <Input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
            </div>
          </div>

          {isEdit && (
            <div>
              <label className="text-sm font-medium mb-1 block">
                ステータス
              </label>
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as MidTermStatus)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper" sideOffset={4} className="bg-background">
                  <SelectItem value="todo">Todo</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <label className="text-sm font-medium mb-1 block">メモ</label>
            <Textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="メモを入力..."
              className="min-h-[80px] max-h-[200px]"
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
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
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
