import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { shortTermRoutes } from "./routes/short-term.js";

const app = new Hono();

app.use("/*", cors());

app.get("/api/health", (c) => {
  return c.json({ status: "ok" });
});

app.route("/api/short-term", shortTermRoutes);

const port = 3001;
console.log(`Server running on http://localhost:${port}`);
serve({ fetch: app.fetch, port });
