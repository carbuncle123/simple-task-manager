import { useState, useEffect } from "react";
import type { Task } from "@simple-task-manager/shared";
import { cn } from "@/lib/utils";
import { formatDeadline } from "@/lib/format-deadline";
import {
  useUpdateTask,
  useToggleTaskStatus,
  useDeleteTask,
} from "@/hooks/use-tasks";

interface TaskCardProps {
  task: Task;
  dragHandleProps?: Record<string, unknown>;
  isDragging?: boolean;
}

function DragHandleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <circle cx="9" cy="6" r="1.5" />
      <circle cx="9" cy="12" r="1.5" />
      <circle cx="9" cy="18" r="1.5" />
      <circle cx="15" cy="6" r="1.5" />
      <circle cx="15" cy="12" r="1.5" />
      <circle cx="15" cy="18" r="1.5" />
    </svg>
  );
}

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function PauseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <rect x="6" y="5" width="4" height="14" rx="1" />
      <rect x="14" y="5" width="4" height="14" rx="1" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M5 13l4 4L19 7" />
    </svg>
  );
}

export function TaskCard({ task, dragHandleProps, isDragging }: TaskCardProps) {
  const updateTask = useUpdateTask();
  const toggleStatus = useToggleTaskStatus();
  const deleteTask = useDeleteTask();

  const [expanded, setExpanded] = useState(false);
  const [name, setName] = useState(task.name);
  const [deadline, setDeadline] = useState(task.deadline);
  const [memo, setMemo] = useState(task.memo);

  useEffect(() => {
    setName(task.name);
    setDeadline(task.deadline);
    setMemo(task.memo);
  }, [task.name, task.deadline, task.memo]);

  const isInProgress = task.status === "in-progress";
  const deadlineInfo = formatDeadline(task.deadline);

  const handleSaveField = (field: "name" | "deadline" | "memo", value: string) => {
    if (field === "name") {
      const trimmed = value.trim();
      if (!trimmed || trimmed === task.name) return;
      updateTask.mutate({ id: task.id, data: { name: trimmed } });
    } else if (field === "deadline") {
      if (!value || value === task.deadline) return;
      updateTask.mutate({ id: task.id, data: { deadline: value } });
    } else if (field === "memo") {
      if (value === task.memo) return;
      updateTask.mutate({ id: task.id, data: { memo: value } });
    }
  };

  const stop = (e: React.MouseEvent | React.PointerEvent) =>
    e.stopPropagation();

  const borderClass =
    deadlineInfo.urgency === "overdue"
      ? "border-red-300"
      : deadlineInfo.urgency === "today"
        ? "border-orange-300"
        : isInProgress
          ? "border-sky-200"
          : "border-slate-200";

  const deadlineTextClass =
    deadlineInfo.urgency === "overdue"
      ? "text-red-600 font-semibold"
      : deadlineInfo.urgency === "today"
        ? "text-orange-600 font-medium"
        : isInProgress
          ? "text-slate-600"
          : "text-slate-500";

  return (
    <article
      className={cn(
        "group rounded-lg border shadow-sm hover:shadow-md transition cursor-pointer",
        isInProgress ? "bg-sky-50" : "bg-white",
        borderClass,
        isDragging && "opacity-50",
        expanded && "shadow-md"
      )}
      onClick={() => setExpanded((v) => !v)}
    >
      <div className="flex items-center gap-2 p-3">
        <button
          type="button"
          className={cn(
            "cursor-grab opacity-0 group-hover:opacity-100 transition flex-shrink-0",
            isInProgress ? "text-sky-300" : "text-slate-300"
          )}
          aria-label="ドラッグして並び替え"
          onClick={stop}
          onPointerDown={stop}
          {...dragHandleProps}
        >
          <DragHandleIcon className="w-4 h-4" />
        </button>

        <button
          type="button"
          className={cn(
            "flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition",
            isInProgress
              ? "bg-sky-500 border border-sky-500 text-white hover:bg-sky-600"
              : "border border-slate-300 text-slate-400 hover:border-sky-400 hover:text-sky-500"
          )}
          aria-label={isInProgress ? "対応前に戻す" : "対応中に変更"}
          onClick={(e) => {
            stop(e);
            toggleStatus.mutate(task.id);
          }}
        >
          {isInProgress ? (
            <PauseIcon className="w-3 h-3" />
          ) : (
            <PlayIcon className="w-3.5 h-3.5 ml-0.5" />
          )}
        </button>

        <div className="flex-1 min-w-0" onClick={stop}>
          {expanded ? (
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => handleSaveField("name", name)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  (e.target as HTMLInputElement).blur();
                }
              }}
              className={cn(
                "w-full text-sm font-medium text-slate-900 bg-transparent border-b focus:outline-none px-1 py-0.5",
                isInProgress
                  ? "border-sky-300 focus:border-sky-500"
                  : "border-slate-300 focus:border-blue-500"
              )}
            />
          ) : (
            <>
              <p
                className="text-sm font-medium text-slate-900 truncate cursor-pointer"
                onClick={() => setExpanded(true)}
              >
                {task.name}
              </p>
              <p className={cn("text-xs mt-0.5", deadlineTextClass)}>
                {deadlineInfo.label}
              </p>
            </>
          )}
        </div>

        <button
          type="button"
          className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition"
          aria-label="完了"
          onClick={(e) => {
            stop(e);
            deleteTask.mutate(task.id);
          }}
        >
          <CheckIcon className="w-4 h-4" />
        </button>
      </div>

      {expanded && (
        <div className="px-3 pb-3 ml-9 space-y-2" onClick={stop}>
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-600 w-10">締切</label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => {
                setDeadline(e.target.value);
                handleSaveField("deadline", e.target.value);
              }}
              className={cn(
                "text-xs rounded px-2 py-1 focus:outline-none border bg-white",
                isInProgress
                  ? "border-sky-300 focus:border-sky-500"
                  : "border-slate-300 focus:border-blue-500"
              )}
            />
            <span className={cn("text-xs", deadlineTextClass)}>
              {deadlineInfo.label.replace(/^[\d/]+\s/, "")}
            </span>
          </div>
          <div className="flex items-start gap-2">
            <label className="text-xs text-slate-600 w-10 mt-1">メモ</label>
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              onBlur={() => handleSaveField("memo", memo)}
              placeholder="メモを追加…"
              className={cn(
                "flex-1 text-xs rounded px-2 py-1 min-h-[60px] focus:outline-none border bg-white resize-y",
                isInProgress
                  ? "border-sky-300 focus:border-sky-500"
                  : "border-slate-300 focus:border-blue-500"
              )}
            />
          </div>
        </div>
      )}
    </article>
  );
}
