import "dotenv/config";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import { runGraphTool, runGraphHandler } from "./tools/run-graph.js";
import { queryRagTool, queryRagHandler } from "./tools/query-rag.js";
import { gatewayStatsTool, gatewayStatsHandler } from "./tools/gateway-stats.js";
import { getTraceTool, getTraceHandler } from "./tools/get-trace.js";

const server = new Server(
  { name: "orchestra-mcp", version: "0.1.0" },
  { capabilities: { tools: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [runGraphTool, queryRagTool, gatewayStatsTool, getTraceTool],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    let result: string;
    switch (name) {
      case "run_agent_graph":
        result = await runGraphHandler(args);
        break;
      case "query_rag":
        result = await queryRagHandler(args);
        break;
      case "get_gateway_stats":
        result = await gatewayStatsHandler(args);
        break;
      case "get_trace":
        result = await getTraceHandler(args);
        break;
      default:
        return {
          content: [{ type: "text", text: `Unknown tool: ${name}` }],
          isError: true,
        };
    }
    return { content: [{ type: "text", text: result }] };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { content: [{ type: "text", text: `Error: ${message}` }], isError: true };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
