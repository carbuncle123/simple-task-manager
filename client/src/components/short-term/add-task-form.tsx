import { useState, type KeyboardEvent } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useCreateShortTermTask } from "@/hooks/use-short-term-tasks";

export function AddTaskForm() {
  const [name, setName] = useState("");
  const createTask = useCreateShortTermTask();

  const handleSubmit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    createTask.mutate({ name: trimmed });
    setName("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex gap-2 mb-3">
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="タスクを追加..."
        className="h-9 text-sm"
      />
      <Button onClick={handleSubmit} size="sm" className="h-9 shrink-0">
        追加
      </Button>
    </div>
  );
}
