import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { api } from "./lib/api";

const queryClient = new QueryClient();

function HealthCheck() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["health"],
    queryFn: () => api.get<{ status: string }>("/health"),
  });

  if (isLoading) return <p className="text-muted-foreground">Connecting...</p>;
  if (error) return <p className="text-destructive">Connection failed</p>;

  return (
    <p className="text-primary font-medium">
      Server status: {data?.status}
    </p>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex items-center justify-center min-h-svh">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Simple Task Manager</h1>
          <HealthCheck />
        </div>
      </div>
    </QueryClientProvider>
  );
}

export default App;
