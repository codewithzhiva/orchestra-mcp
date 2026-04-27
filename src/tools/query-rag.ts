import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

export const queryRagTool: Tool = {
  name: "query_rag",
  description:
    "Ask a question against the RAG Chat document store. Retrieves semantically relevant chunks and returns a generated answer with source citations.",
  inputSchema: {
    type: "object",
    properties: {
      question: {
        type: "string",
        description: "The question to answer from uploaded documents",
      },
    },
    required: ["question"],
  },
};

const ArgsSchema = z.object({ question: z.string() });

interface SSEEvent {
  type: "token" | "sources" | "done" | "error";
  content?: string;
  sources?: { filename: string; chunkIndex: number; excerpt: string }[];
}

export async function queryRagHandler(args: unknown): Promise<string> {
  const { question } = ArgsSchema.parse(args);
  const baseUrl = process.env.RAG_URL ?? "http://localhost:3000";

  const res = await fetch(`${baseUrl}/chat/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: question }),
  });

  if (!res.ok) {
    throw new Error(`RAG /chat/stream failed (${res.status}): ${await res.text()}`);
  }

  // Consume SSE stream and collect full answer
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let answer = "";
  const sources: SSEEvent["sources"] = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const raw = line.slice(6).trim();
      if (!raw) continue;
      try {
        const ev = JSON.parse(raw) as SSEEvent;
        if (ev.type === "token" && ev.content) answer += ev.content;
        if (ev.type === "sources" && ev.sources) sources.push(...ev.sources);
        if (ev.type === "error") throw new Error(ev.content ?? "RAG error");
      } catch {
        // skip malformed events
      }
    }
  }

  return JSON.stringify({
    answer,
    sources: sources.map((s) => ({
      file: s.filename,
      chunk: s.chunkIndex,
      excerpt: s.excerpt,
    })),
  });
}
