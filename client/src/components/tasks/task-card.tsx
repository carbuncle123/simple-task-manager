import type { Task } from "@simple-task-manager/shared";
import { useDeleteTask, useToggleTaskStatus } from "@/hooks/use-tasks";
import { formatDeadline } from "@/lib/format-deadline";
import { linkify } from "@/lib/linkify";
import { cn } from "@/lib/utils";

interface TaskCardProps {
  task: Task;
  dragHandleProps?: Record<string, unknown>;
  isDragging?: boolean;
  isSelected?: boolean;
  onSelect?: (taskId: number) => void;
  onDeleted?: (taskId: number) => void;
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

export function TaskCard({
  task,
  dragHandleProps,
  isDragging,
  isSelected,
  onSelect,
  onDeleted,
}: TaskCardProps) {
  const toggleStatus = useToggleTaskStatus();
  const deleteTask = useDeleteTask();

  const isInProgress = task.status === "in-progress";
  const deadlineInfo = formatDeadline(task.deadline);

  const stop = (event: React.MouseEvent | React.PointerEvent) => {
    event.stopPropagation();
  };

  const borderClass =
    deadlineInfo.urgency === "overdue"
      ? "border-red-300"
      : deadlineInfo.urgency === "today"
        ? "border-orange-300"
        : isSelected
          ? "border-blue-300"
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
        "group rounded-xl border bg-white shadow-sm transition hover:shadow-md",
        isInProgress && "bg-sky-50/60",
        isSelected && "ring-2 ring-blue-100",
        borderClass,
        isDragging && "opacity-50"
      )}
      onClick={() => onSelect?.(task.id)}
    >
      <div className="flex items-start gap-3 p-4">
        <button
          type="button"
          className={cn(
            "mt-1 cursor-grab opacity-0 transition group-hover:opacity-100 flex-shrink-0",
            isInProgress ? "text-sky-300" : "text-slate-300"
          )}
          aria-label="ドラッグして並び替え"
          onClick={stop}
          onPointerDown={stop}
          {...dragHandleProps}
        >
          <DragHandleIcon className="h-4 w-4" />
        </button>

        <button
          type="button"
          className={cn(
            "mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full transition",
            isInProgress
              ? "border border-sky-500 bg-sky-500 text-white hover:bg-sky-600"
              : "border border-slate-300 text-slate-400 hover:border-sky-400 hover:text-sky-500"
          )}
          aria-label={isInProgress ? "対応前に戻す" : "対応中に変更"}
          onClick={(event) => {
            stop(event);
            toggleStatus.mutate(task.id);
          }}
        >
          {isInProgress ? (
            <PauseIcon className="h-3 w-3" />
          ) : (
            <PlayIcon className="ml-0.5 h-3.5 w-3.5" />
          )}
        </button>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium leading-6 text-slate-900 whitespace-pre-wrap break-words">
            {task.name}
          </p>
          <p className={cn("mt-1 text-xs", deadlineTextClass)}>{deadlineInfo.label}</p>
          {task.memo ? (
            <div className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-600">
              <div className="overflow-hidden [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:3] break-words">
                {linkify(task.memo)}
              </div>
            </div>
          ) : null}
        </div>

        <button
          type="button"
          className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-emerald-50 hover:text-emerald-600"
          aria-label="完了"
          onClick={(event) => {
            stop(event);
            deleteTask.mutate(task.id, {
              onSuccess: () => onDeleted?.(task.id),
            });
          }}
        >
          <CheckIcon className="h-4 w-4" />
        </button>
      </div>
    </article>
  );
}
