import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import type { Project, Task } from "@simple-task-manager/shared";
import { AddTaskForm } from "./add-task-form";
import { SortableTaskCard } from "./sortable-task-card";

interface ProjectColumnProps {
  project: Project;
  tasks: Task[];
}

export function ProjectColumn({ project, tasks }: ProjectColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `column-${project.id}`,
    data: { type: "column", projectId: project.id },
  });

  return (
    <section className="flex-shrink-0 w-80 bg-slate-50 border border-slate-200 rounded-lg flex flex-col max-h-[calc(100vh-160px)]">
      <header className="px-4 py-3 border-b border-slate-200 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <h2 className="text-sm font-semibold text-slate-900 truncate">
            {project.name}
          </h2>
          <span className="text-xs text-slate-500 flex-shrink-0">
            {tasks.length}
          </span>
        </div>
      </header>

      <div className="px-4 py-3 border-b border-slate-200 flex-shrink-0">
        <AddTaskForm projectId={project.id} />
      </div>

      <div
        ref={setNodeRef}
        className={
          "px-3 py-3 space-y-2 overflow-y-auto flex-1 transition-colors " +
          (isOver ? "bg-blue-50/40" : "")
        }
      >
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.length === 0 ? (
            <div className="py-8 flex items-center justify-center">
              <p className="text-xs text-slate-400 text-center leading-relaxed">
                まだタスクがありません<br />
                上のフォームから追加できます
              </p>
            </div>
          ) : (
            tasks.map((task) => <SortableTaskCard key={task.id} task={task} />)
          )}
        </SortableContext>
      </div>
    </section>
  );
}
