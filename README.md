# orchestra-mcp

MCP server that exposes the entire [Local AI Ecosystem](https://github.com/codewithzhiva) as tools — plug your self-hosted AI stack directly into Claude Desktop, Cursor, or any MCP-compatible client.

## Tools

| Tool | What it does |
|---|---|
| `run_agent_graph` | Trigger an Orchestra run by graph ID. Polls until finished and returns the output. |
| `query_rag` | Ask a question against the RAG Chat document store. Returns a generated answer + source citations. |
| `get_gateway_stats` | Fetch LLM Gateway usage stats — request counts, token totals, cache hit rates, avg latency by model. |
| `get_trace` | Pull a trace + all spans and events from LLM Observatory by trace ID. |

## Stack

- **Transport**: stdio (MCP standard)
- **Runtime**: Node.js 20+, TypeScript
- **SDK**: `@modelcontextprotocol/sdk`

## Setup

```bash
git clone https://github.com/codewithzhiva/orchestra-mcp
cd orchestra-mcp
npm install
cp .env.example .env   # fill in your service URLs + tokens
npm run build
```

## Claude Desktop config

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "orchestra": {
      "command": "node",
      "args": ["/absolute/path/to/orchestra-mcp/dist/index.js"]
    }
  }
}
```

Restart Claude Desktop. The four tools will appear automatically.

## Environment variables

```env
ORCHESTRA_URL=http://localhost:3030
ORCHESTRA_TOKEN=your-orchestra-admin-token

RAG_URL=http://localhost:3000

GATEWAY_URL=http://localhost:3040
GATEWAY_ADMIN_TOKEN=your-gateway-admin-token

OBSERVATORY_URL=http://localhost:4000
OBSERVATORY_TOKEN=your-observatory-token
```

## Related projects

- [orchestra-api](https://github.com/codewithzhiva/orchestra-api) — multi-agent orchestration engine
- [rag-chat](https://github.com/codewithzhiva/rag-chat) — document Q&A with semantic search
- [llm-gateway](https://github.com/codewithzhiva/llm-gateway) — LLM proxy with caching and routing
- [llm-observatory](https://github.com/codewithzhiva/llm-observatory) — observability platform

## License

MIT
