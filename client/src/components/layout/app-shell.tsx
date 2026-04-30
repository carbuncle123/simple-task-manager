import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LongTermView } from "@/components/long-term/long-term-view";
import { SettingsView } from "@/components/settings/settings-view";

function PhasePlaceholder({ phase, label }: { phase: string; label: string }) {
  return (
    <div className="bg-white border border-dashed border-slate-300 rounded-lg p-12 text-center">
      <p className="text-sm font-medium text-slate-900">{label}</p>
      <p className="text-xs text-slate-500 mt-1">
        {phase} で実装予定
      </p>
    </div>
  );
}

export function AppShell() {
  return (
    <div className="min-h-svh bg-background">
      <div className="mx-auto max-w-[1400px] px-4 py-4 md:p-6">
        <h1 className="text-xl md:text-2xl font-bold mb-4 md:mb-5">
          Simple Task Manager
        </h1>
        <Tabs defaultValue="settings">
          <TabsList>
            <TabsTrigger value="tasks">タスク</TabsTrigger>
            <TabsTrigger value="gantt">ガント</TabsTrigger>
            <TabsTrigger value="long-term">長期</TabsTrigger>
            <TabsTrigger value="settings">設定</TabsTrigger>
          </TabsList>
          <TabsContent value="tasks" className="mt-4">
            <PhasePlaceholder phase="Phase 3" label="タスク管理" />
          </TabsContent>
          <TabsContent value="gantt" className="mt-4">
            <PhasePlaceholder phase="Phase 4" label="ガントチャート" />
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
