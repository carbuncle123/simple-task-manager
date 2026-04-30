import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TasksView } from "@/components/tasks/tasks-view";
import { GanttView } from "@/components/gantt/gantt-view";
import { LongTermView } from "@/components/long-term/long-term-view";
import { SettingsView } from "@/components/settings/settings-view";

export function AppShell() {
  return (
    <div className="min-h-svh bg-background">
      <div className="mx-auto max-w-[1400px] px-4 py-4 md:p-6">
        <h1 className="text-xl md:text-2xl font-bold mb-4 md:mb-5">
          Simple Task Manager
        </h1>
        <Tabs defaultValue="tasks">
          <TabsList>
            <TabsTrigger value="tasks">タスク</TabsTrigger>
            <TabsTrigger value="gantt">ガント</TabsTrigger>
            <TabsTrigger value="long-term">長期</TabsTrigger>
            <TabsTrigger value="settings">設定</TabsTrigger>
          </TabsList>
          <TabsContent value="tasks" className="mt-4">
            <TasksView />
          </TabsContent>
          <TabsContent value="gantt" className="mt-4">
            <GanttView />
          </TabsContent>
          <TabsContent value="long-term" className="mt-4">
            <LongTermView />
          </TabsContent>
          <TabsContent value="settings" className="mt-4">
            <SettingsView />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
