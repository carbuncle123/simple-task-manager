import { useState, useMemo } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Project } from "@simple-task-manager/shared";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useProjects,
  useCreateProject,
  useUpdateProject,
  useDeleteProject,
  useReorderProjects,
} from "@/hooks/use-projects";
import { useTasks } from "@/hooks/use-tasks";

function DragHandleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <circle cx="9" cy="6" r="1.5" />
      <circle cx="9" cy="12" r="1.5" />
      <circle cx="9" cy="18" r="1.5" />
      <circle cx="15" cy="6" r="1.5" />
      <circle cx="15" cy="12" r="1.5" />
      <circle cx="15" cy="18" r="1.5" />
    </svg>
  );
}

function AlertIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

interface SortableRowProps {
  project: Project;
  taskCount: number;
  onEdit: () => void;
  onDelete: () => void;
}

function SortableRow({ project, taskCount, onEdit, onDelete }: SortableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: project.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="group flex items-center gap-3 px-6 py-3 hover:bg-slate-50"
      {...attributes}
    >
      <button
        type="button"
        className="text-slate-300 hover:text-slate-500 cursor-grab opacity-0 group-hover:opacity-100 transition flex-shrink-0"
        aria-label="ドラッグして並び替え"
        {...listeners}
      >
        <DragHandleIcon className="w-4 h-4" />
      </button>
      <div className="flex-1 min-w-0 flex items-center gap-2">
        <span className="text-sm font-medium text-slate-900 truncate">
          {project.name}
        </span>
        <span
          className={
            taskCount > 0
              ? "text-[11px] text-slate-500 flex-shrink-0"
              : "text-[11px] text-slate-400 flex-shrink-0"
          }
        >
          {taskCount > 0 ? `${taskCount} 件のタスク` : "タスクなし"}
        </span>
      </div>
      <div className="flex gap-1 md:opacity-0 md:group-hover:opacity-100 transition flex-shrink-0">
        <Button variant="ghost" size="sm" onClick={onEdit} className="h-7 px-2.5 text-xs">
          編集
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          className="h-7 px-2.5 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          削除
        </Button>
      </div>
    </li>
  );
}

interface EditingRowProps {
  project: Project;
  taskCount: number;
  onSave: (name: string) => void;
  onCancel: () => void;
}

function EditingRow({ project, taskCount, onSave, onCancel }: EditingRowProps) {
  const [name, setName] = useState(project.name);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      e.preventDefault();
      onCancel();
    }
  };

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onSave(trimmed);
  };

  return (
    <li className="flex items-center gap-3 px-6 py-3 bg-blue-50/40">
      <span className="text-slate-300 flex-shrink-0">
        <DragHandleIcon className="w-4 h-4" />
      </span>
      <Input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={handleKeyDown}
        className="flex-1 h-8 text-sm font-medium"
      />
      <span className="text-[11px] text-slate-500 flex-shrink-0">
        {taskCount > 0 ? `${taskCount} 件のタスク` : "タスクなし"}
      </span>
      <div className="flex gap-1 flex-shrink-0">
        <Button size="sm" onClick={handleSave} className="h-7 px-3 text-xs">
          保存
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onCancel}
          className="h-7 px-3 text-xs"
        >
          キャンセル
        </Button>
      </div>
    </li>
  );
}

export function ProjectManager() {
  const projectsQuery = useProjects();
  const tasksQuery = useTasks();
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();
  const reorderProjects = useReorderProjects();

  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);

  const projects = projectsQuery.data ?? [];
  const tasks = tasksQuery.data ?? [];

  const taskCountByProject = useMemo(() => {
    const map = new Map<number, number>();
    for (const task of tasks) {
      map.set(task.projectId, (map.get(task.projectId) ?? 0) + 1);
    }
    return map;
  }, [tasks]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleAdd = () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    createProject.mutate({ name: trimmed }, { onSuccess: () => setNewName("") });
  };

  const handleSaveEdit = (id: number, name: string) => {
    updateProject.mutate(
      { id, data: { name } },
      { onSuccess: () => setEditingId(null) }
    );
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    deleteProject.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = projects.findIndex((p) => p.id === active.id);
    const newIndex = projects.findIndex((p) => p.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const next = [...projects];
    const [moved] = next.splice(oldIndex, 1);
    next.splice(newIndex, 0, moved);
    reorderProjects.mutate(next.map((p) => p.id));
  };

  return (
    <>
      <section className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-base font-semibold text-slate-900">
            プロジェクト管理
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            タスクは必ずいずれかのプロジェクトに属します。並び順はタスクタブ・ガントタブの表示順になります。
          </p>
        </div>

        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50">
          <div className="flex gap-2">
            <Input
              placeholder="新しいプロジェクト名..."
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAdd();
                }
              }}
              className="flex-1"
            />
            <Button onClick={handleAdd} disabled={!newName.trim()}>
              追加
            </Button>
          </div>
        </div>

        {projectsQuery.isLoading ? (
          <ul className="divide-y divide-slate-200">
            {[0, 1, 2].map((i) => (
              <li key={i} className="px-6 py-3">
                <Skeleton className="h-5 w-48" />
              </li>
            ))}
          </ul>
        ) : projects.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm text-slate-500">
              プロジェクトがまだありません
            </p>
            <p className="text-xs text-slate-400 mt-1">
              上のフォームから最初のプロジェクトを追加してください
            </p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={projects.map((p) => p.id)}
              strategy={verticalListSortingStrategy}
            >
              <ul className="divide-y divide-slate-200">
                {projects.map((project) =>
                  editingId === project.id ? (
                    <EditingRow
                      key={project.id}
                      project={project}
                      taskCount={taskCountByProject.get(project.id) ?? 0}
                      onSave={(name) => handleSaveEdit(project.id, name)}
                      onCancel={() => setEditingId(null)}
                    />
                  ) : (
                    <SortableRow
                      key={project.id}
                      project={project}
                      taskCount={taskCountByProject.get(project.id) ?? 0}
                      onEdit={() => setEditingId(project.id)}
                      onDelete={() => setDeleteTarget(project)}
                    />
                  )
                )}
              </ul>
            </SortableContext>
          </DndContext>
        )}
      </section>

      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <span className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertIcon className="w-5 h-5 text-red-600" />
              </span>
              <span>
                プロジェクト「{deleteTarget?.name}」を削除
              </span>
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600 leading-relaxed mt-2">
            {deleteTarget && taskCountByProject.get(deleteTarget.id) ? (
              <>
                このプロジェクトに紐づく
                <strong className="text-red-600">
                  {" "}
                  {taskCountByProject.get(deleteTarget.id)} 件のタスク
                </strong>{" "}
                も全て削除されます。この操作は取り消せません。
              </>
            ) : (
              "この操作は取り消せません。"
            )}
          </p>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>
              キャンセル
            </Button>
            <Button
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              削除する
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
