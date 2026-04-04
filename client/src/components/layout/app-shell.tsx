import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CombinedView } from "@/components/combined/combined-view";
import { LongTermPlaceholder } from "@/components/long-term/long-term-placeholder";

export function AppShell() {
  return (
    <div className="min-h-svh bg-background">
      <div className="mx-auto max-w-[1400px] p-6">
        <h1 className="text-2xl font-bold mb-5">Simple Task Manager</h1>
        <Tabs defaultValue="tasks">
          <TabsList>
            <TabsTrigger value="tasks">タスク</TabsTrigger>
            <TabsTrigger value="long-term">長期</TabsTrigger>
          </TabsList>
          <TabsContent value="tasks" className="mt-4">
            <CombinedView />
          </TabsContent>
          <TabsContent value="long-term" className="mt-4">
            <LongTermPlaceholder />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
