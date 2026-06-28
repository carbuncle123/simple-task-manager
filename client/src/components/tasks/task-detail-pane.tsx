import { useEffect, useState } from "react";
import type { Project, Task } from "@simple-task-manager/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useDeleteTask, useToggleTaskStatus, useUpdateTask } from "@/hooks/use-tasks";
import { formatDeadline } from "@/lib/format-deadline";
import { linkify } from "@/lib/linkify";
import { cn } from "@/lib/utils";

interface TaskDetailPaneProps {
  task: Task | null;
  project: Project | null;
  onDeleted?: (taskId: number) => void;
}

function EmptyState() {
  return (
    <aside className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-semibold text-slate-900">タスクを選択してください</p>
      <p className="mt-2 text-sm leading-6 text-slate-500">
        左側の一覧からタスクを選ぶと、詳細・編集・メモのリンクをここで確認できます。
      </p>
    </aside>
  );
}

export function TaskDetailPane({ task, project, onDeleted }: TaskDetailPaneProps) {
  const updateTask = useUpdateTask();
  const toggleStatus = useToggleTaskStatus();
  const deleteTask = useDeleteTask();

  const [name, setName] = useState("");
  const [deadline, setDeadline] = useState("");
  const [memo, setMemo] = useState("");

  useEffect(() => {
    setName(task?.name ?? "");
    setDeadline(task?.deadline ?? "");
    setMemo(task?.memo ?? "");
  }, [task]);

  if (!task) {
    return <EmptyState />;
  }

  const isInProgress = task.status === "in-progress";
  const deadlineInfo = formatDeadline(task.deadline);

  const saveName = () => {
    const trimmed = name.trim();
    if (!trimmed || trimmed === task.name) return;
    updateTask.mutate({ id: task.id, data: { name: trimmed } });
  };

  const saveDeadline = (value: string) => {
    if (!value || value === task.deadline) return;
    updateTask.mutate({ id: task.id, data: { deadline: value } });
  };

  const saveMemo = () => {
    if (memo === task.memo) return;
    updateTask.mutate({ id: task.id, data: { memo } });
  };

  return (
    <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:sticky md:top-6">
      <div className="flex items-start justify-between gap-3 border-b border-slate-200 pb-4">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-400">
            Task Detail
          </p>
          <p className="mt-2 text-sm font-semibold text-slate-900">
            {project?.name ?? "未分類"}
          </p>
          <p
            className={cn(
              "mt-1 text-xs",
              deadlineInfo.urgency === "overdue"
                ? "text-red-600"
                : deadlineInfo.urgency === "today"
                  ? "text-orange-600"
                  : "text-slate-500"
            )}
          >
            {deadlineInfo.label}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={isInProgress ? "secondary" : "outline"}
            size="sm"
            onClick={() => toggleStatus.mutate(task.id)}
          >
            {isInProgress ? "対応前に戻す" : "対応中にする"}
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() =>
              deleteTask.mutate(task.id, {
                onSuccess: () => onDeleted?.(task.id),
              })
            }
          >
            完了
          </Button>
        </div>
      </div>

      <div className="mt-5 space-y-5">
        <div>
          <label className="mb-2 block text-xs font-medium text-slate-500">タイトル</label>
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            onBlur={saveName}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                saveName();
                (event.target as HTMLInputElement).blur();
              }
            }}
            className="h-auto min-h-11 leading-6"
          />
        </div>

        <div>
          <label className="mb-2 block text-xs font-medium text-slate-500">締切</label>
          <Input
            type="date"
            value={deadline}
            onChange={(event) => {
              setDeadline(event.target.value);
              saveDeadline(event.target.value);
            }}
          />
        </div>

        <div>
          <label className="mb-2 block text-xs font-medium text-slate-500">メモ全文</label>
          {memo ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700 break-words">
              {linkify(memo)}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-3 text-sm text-slate-400">
              メモはまだありません
            </div>
          )}
          <label className="mb-2 mt-4 block text-xs font-medium text-slate-500">メモを編集</label>
          <Textarea
            value={memo}
            onChange={(event) => setMemo(event.target.value)}
            onBlur={saveMemo}
            placeholder="メモを入力すると、URL は自動でリンクになります"
            className="min-h-40 resize-y leading-6"
          />
        </div>
      </div>
    </aside>
  );
}
