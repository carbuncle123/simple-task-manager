import { useState, useRef, useEffect, type KeyboardEvent } from "react";
import { GripVertical, X } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { ShortTermTask } from "@simple-task-manager/shared";
import {
  useToggleShortTermTask,
  useUpdateShortTermTask,
  useDeleteShortTermTask,
} from "@/hooks/use-short-term-tasks";
import { linkify } from "@/lib/linkify";

interface TaskCardProps {
  task: ShortTermTask;
  dragHandleProps?: Record<string, unknown>;
}

export function TaskCard({ task, dragHandleProps }: TaskCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [description, setDescription] = useState(task.description);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const toggleTask = useToggleShortTermTask();
  const updateTask = useUpdateShortTermTask();
  const deleteTask = useDeleteShortTermTask();

  useEffect(() => {
    if (isExpanded && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isExpanded]);

  const handleSaveDescription = () => {
    if (description !== task.description) {
      updateTask.mutate({ id: task.id, data: { description } });
    }
    setIsExpanded(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Escape") {
      setDescription(task.description);
      setIsExpanded(false);
    }
  };

  return (
    <div
      className={cn(
        "flex items-start gap-2.5 bg-card border rounded-lg px-3 py-2.5 cursor-pointer transition-all group",
        isExpanded
          ? "shadow-sm border-primary"
          : "hover:shadow-sm"
      )}
      onClick={() => !isExpanded && setIsExpanded(true)}
    >
      {/* Drag handle */}
      <div
        className="mt-0.5 cursor-grab text-muted-foreground hover:text-foreground"
        {...dragHandleProps}
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="h-4 w-4" />
      </div>

      {/* Checkbox */}
      <button
        className={cn(
          "mt-0.5 w-4.5 h-4.5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
          task.status === "done"
            ? "bg-green-500 border-green-500 text-white"
            : "border-border hover:border-primary"
        )}
        onClick={(e) => {
          e.stopPropagation();
          toggleTask.mutate(task.id);
        }}
      >
        {task.status === "done" && (
          <span className="text-[10px] font-bold">✓</span>
        )}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div
          className={cn(
            "text-sm font-medium",
            task.status === "done" && "line-through text-muted-foreground"
          )}
        >
          {task.name}
        </div>

        {/* Description: show text when collapsed, textarea when expanded */}
        {!isExpanded && task.description && (
          <div className="text-xs text-muted-foreground mt-0.5 whitespace-pre-wrap break-words">
            {linkify(task.description)}
          </div>
        )}

        {isExpanded && (
          <div className="mt-1.5" onClick={(e) => e.stopPropagation()}>
            <Textarea
              ref={textareaRef}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={handleSaveDescription}
              onKeyDown={handleKeyDown}
              placeholder="説明を追加..."
              className="text-xs min-h-[48px] resize-y"
            />
            <div className="text-[10px] text-muted-foreground mt-1 text-right">
              Esc で閉じる
            </div>
          </div>
        )}
      </div>

      {/* Delete button */}
      <button
        className="mt-0.5 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => {
          e.stopPropagation();
          deleteTask.mutate(task.id);
        }}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
