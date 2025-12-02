# MCP Server Example

This example shows how to use the DDG Web Search MCP Server with AI assistants.

## Configuration

Add this to your MCP client configuration (e.g., Claude Desktop):

```json
{
  "mcpServers": {
    "ddg-web-search": {
      "command": "npx",
      "args": ["@lucid-spark/ddg-web-search", "mcp"],
      "env": {}
    }
  }
}
```

Or if installed globally:

```json
{
  "mcpServers": {
    "ddg-web-search": {
      "command": "@lucid-spark/ddg-web-search",
      "args": [],
      "env": {}
    }
  }
}
```

## Available Tools

### 1. search

Search the web for results.

**Input Schema:**

```json
{
  "query": "your search terms"
}
```

**Example Usage:**

```
Tool: search
Parameters: {"query": "TypeScript tutorials"}
```

### 2. fetch_web_content

Fetch and parse content from a web URL.

**Input Schema:**

```json
{
  "url": "https://example.com"
}
```

**Example Usage:**

```
Tool: fetch_web_content
Parameters: {"url": "https://docs.microsoft.com/en-us/typescript/"}
```

## Development

To run the MCP server locally for testing:

```bash
# Development mode
npm run mcp

# Production mode
npm run build
node dist/mcp.js

# Or using the global binary
ddg-web-search-mcp
```

## Integration with AI Assistants

Once configured, AI assistants can use these tools to:

1. **Search the web** for current information
2. **Fetch content** from specific URLs for analysis
3. **Research topics** by combining search and content fetching

The MCP server handles rate limiting automatically and provides structured responses that AI assistants can easily parse and use.
