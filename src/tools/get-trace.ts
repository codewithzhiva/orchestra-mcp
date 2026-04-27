import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

export const getTraceTool: Tool = {
  name: "get_trace",
  description:
    "Retrieve a trace from LLM Observatory including all spans and events. Useful for debugging LLM call chains and inspecting token usage.",
  inputSchema: {
    type: "object",
    properties: {
      traceId: {
        type: "string",
        description: "The trace ID to look up",
      },
    },
    required: ["traceId"],
  },
};

const ArgsSchema = z.object({ traceId: z.string() });

export async function getTraceHandler(args: unknown): Promise<string> {
  const { traceId } = ArgsSchema.parse(args);
  const baseUrl = process.env.OBSERVATORY_URL ?? "http://localhost:4000";
  const token = process.env.OBSERVATORY_TOKEN ?? "";

  const res = await fetch(`${baseUrl}/traces/${traceId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (res.status === 404) {
    return JSON.stringify({ error: `Trace ${traceId} not found` });
  }
  if (!res.ok) {
    throw new Error(`GET /traces/${traceId} failed (${res.status}): ${await res.text()}`);
  }

  const data = await res.json();
  return JSON.stringify(data);
}
