import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

export const gatewayStatsTool: Tool = {
  name: "get_gateway_stats",
  description:
    "Fetch LLM Gateway usage statistics — request counts, token totals, cache hit rates, and average latency broken down by provider and model.",
  inputSchema: {
    type: "object",
    properties: {
      limit: {
        type: "number",
        description: "Max number of recent log entries to include (default 50, max 500)",
      },
    },
  },
};

const ArgsSchema = z.object({ limit: z.number().min(1).max(500).default(50) });

interface UsageSummaryRow {
  provider: string;
  model: string;
  requests: number;
  total_prompt_tokens: number;
  total_completion_tokens: number;
  cache_hits: number;
  avg_latency_ms: number;
}

export async function gatewayStatsHandler(args: unknown): Promise<string> {
  const { limit } = ArgsSchema.parse(args ?? {});
  const baseUrl = process.env.GATEWAY_URL ?? "http://localhost:3040";
  const token = process.env.GATEWAY_ADMIN_TOKEN ?? "";

  const res = await fetch(`${baseUrl}/admin/usage?limit=${limit}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error(`GET /admin/usage failed (${res.status}): ${await res.text()}`);
  }

  const { summary } = (await res.json()) as { summary: UsageSummaryRow[] };

  const formatted = summary.map((row) => ({
    provider: row.provider,
    model: row.model,
    requests: row.requests,
    totalTokens: (row.total_prompt_tokens ?? 0) + (row.total_completion_tokens ?? 0),
    cacheHitRate:
      row.requests > 0
        ? `${((row.cache_hits / row.requests) * 100).toFixed(1)}%`
        : "0%",
    avgLatencyMs: Math.round(row.avg_latency_ms ?? 0),
  }));

  return JSON.stringify({ providers: formatted, logLimit: limit });
}
