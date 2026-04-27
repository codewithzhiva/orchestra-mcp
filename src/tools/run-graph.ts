import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

export const runGraphTool: Tool = {
  name: "run_agent_graph",
  description:
    "Trigger an agent graph run on the Orchestra API. Returns the run ID immediately. Optionally polls until the run finishes and returns the output.",
  inputSchema: {
    type: "object",
    properties: {
      graphId: {
        type: "string",
        description: "The ID of the graph to run (e.g. g_abc123)",
      },
      input: {
        type: "string",
        description: "The user input / initial prompt passed to the graph",
      },
      waitForResult: {
        type: "boolean",
        description: "If true, polls until the run finishes and returns the output. Default: true.",
      },
    },
    required: ["graphId", "input"],
  },
};

const ArgsSchema = z.object({
  graphId: z.string(),
  input: z.string(),
  waitForResult: z.boolean().default(true),
});

async function poll(
  baseUrl: string,
  token: string,
  runId: string,
  maxWaitMs = 120_000,
): Promise<{ status: string; output: unknown; error: string | null }> {
  const deadline = Date.now() + maxWaitMs;
  while (Date.now() < deadline) {
    const res = await fetch(`${baseUrl}/runs/${runId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(`GET /runs/${runId} failed: ${res.status}`);
    const data = (await res.json()) as {
      status: string;
      output: unknown;
      error: string | null;
    };
    if (data.status === "finished" || data.status === "failed") return data;
    await new Promise((r) => setTimeout(r, 1_000));
  }
  throw new Error("Timed out waiting for run to finish");
}

export async function runGraphHandler(args: unknown): Promise<string> {
  const { graphId, input, waitForResult } = ArgsSchema.parse(args);
  const baseUrl = process.env.ORCHESTRA_URL ?? "http://localhost:3030";
  const token = process.env.ORCHESTRA_TOKEN ?? "";

  const res = await fetch(`${baseUrl}/runs`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ graphId, input }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`POST /runs failed (${res.status}): ${text}`);
  }

  const { id: runId } = (await res.json()) as { id: string };

  if (!waitForResult) {
    return JSON.stringify({ runId, status: "queued" });
  }

  const result = await poll(baseUrl, token, runId);
  return JSON.stringify({ runId, ...result });
}
