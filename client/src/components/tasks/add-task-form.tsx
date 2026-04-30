import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useCreateTask } from "@/hooks/use-tasks";

interface AddTaskFormProps {
  projectId: number;
}

export function AddTaskForm({ projectId }: AddTaskFormProps) {
  const [name, setName] = useState("");
  const createTask = useCreateTask();

  const handleSubmit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    createTask.mutate(
      { projectId, name: trimmed },
      { onSuccess: () => setName("") }
    );
  };

  return (
    <div className="flex gap-2">
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="タスクを追加..."
        className="h-9 text-sm bg-white"
      />
      <Button onClick={handleSubmit} size="sm" className="h-9 shrink-0">
        追加
      </Button>
    </div>
  );
}
