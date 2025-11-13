#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
  CallToolRequest,
} from "@modelcontextprotocol/sdk/types.js";
import { createServer, IncomingMessage, ServerResponse } from "node:http";
import { URL } from "node:url";
import { WebSearcher, FetchResult, SearchResult, WebContentFetcher } from ".";

interface SearchToolArgs {
  query?: string;
}

interface FetchToolArgs {
  url?: string;
}

type TransportType = "stdio" | "http";

interface ServerOptions {
  transport: TransportType;
  port?: number;
  host?: string;
}

/**
 * MCP Server for Web Searching and Web Content Fetching
 *
 * This server provides the following tools:
 * 1. search - Search the web for web results
 * 2. fetch_web_content - Fetch and parse content from a web URL
 *
 * Supports both stdio and HTTP (SSE) transports
 */
class MCPServer {
  private server: Server;
  private searcher: WebSearcher;
  private fetcher: WebContentFetcher;
  private options: ServerOptions;
  private httpServer?: ReturnType<typeof createServer>;
  private activeTransports: Map<string, SSEServerTransport> = new Map();

  constructor(options: ServerOptions = { transport: "stdio" }) {
    this.options = {
      port: 3001,
      host: "localhost",
      ...options,
    };

    this.searcher = new WebSearcher();
    this.fetcher = new WebContentFetcher();

    this.server = new Server({
      name: "ddg-web-search",
      version: "1.0.2",
    });

    this.setupToolHandlers();
    this.setupErrorHandling();
  }

  private setupToolHandlers(): void {
    // Handle tool listing
    /* istanbul ignore next */
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: this.getAvailableTools(),
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(
      CallToolRequestSchema,
      /* istanbul ignore next */
      async (request: CallToolRequest) => {
        const { name, arguments: args } = request.params;

        try {
          switch (name) {
            case "search":
              return await this.handleSearchTool(args as SearchToolArgs);
            case "fetch_web_content":
              return await this.handleFetchTool(args as FetchToolArgs);
            default:
              throw new Error(`Unknown tool: ${name}`);
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error occurred";
          return {
            content: [
              {
                type: "text",
                text: `Error: ${errorMessage}`,
              },
            ],
            isError: true,
          };
        }
      },
    );
  }

  private getAvailableTools(): Tool[] {
    return [
      {
        name: "search",
        description:
          "Search the web using DuckDuckGo with browser automation. Returns a list of search results with titles, URLs, and snippets.",
        inputSchema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "The search query to execute on DuckDuckGo",
              minLength: 1,
            },
          },
          required: ["query"],
        },
      },
      {
        name: "fetch_web_content",
        description:
          "Fetch and parse content from a web URL. Returns the text content of the webpage.",
        inputSchema: {
          type: "object",
          properties: {
            url: {
              type: "string",
              description: "The URL to fetch content from",
              format: "uri",
            },
          },
          required: ["url"],
        },
      },
    ];
  }

  private async handleSearchTool(args: SearchToolArgs) {
    if (!args?.query || typeof args.query !== "string") {
      throw new Error("Missing or invalid query parameter");
    }

    const query = args.query.trim();
    if (query.length === 0) {
      throw new Error("Query cannot be empty");
    }

    try {
      const results: SearchResult[] = await this.searcher.search(query);

      if (results.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: `No search results found for query: "${query}"`,
            },
          ],
        };
      }

      // Format results as structured text
      const formattedResults = results
        .map(
          (result, index) =>
            `${index + 1}. **${result.title}**\n   URL: ${result.url}\n   ${result.snippet}\n`,
        )
        .join("\n");

      return {
        content: [
          {
            type: "text",
            text: `Found ${results.length} search results for "${query}":\n\n${formattedResults}`,
          },
        ],
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Search failed";
      throw new Error(`Web search failed: ${errorMessage}`);
    }
  }

  private async handleFetchTool(args: FetchToolArgs) {
    if (!args?.url || typeof args.url !== "string") {
      throw new Error("Missing or invalid URL parameter");
    }

    const url = args.url.trim();
    if (url.length === 0) {
      throw new Error("URL cannot be empty");
    }

    // Basic URL validation
    try {
      new URL(url);
    } catch {
      throw new Error("Invalid URL format");
    }

    try {
      const result: FetchResult = await this.fetcher.fetch(url);

      if (!result.success) {
        throw new Error(result.error || "Failed to fetch content");
      }

      if (!result.data?.content) {
        return {
          content: [
            {
              type: "text",
              text: `Successfully fetched content from ${url}, but no text content was extracted.`,
            },
          ],
        };
      }

      // Truncate very long content
      const maxLength = 10000;
      const content =
        result.data?.content.length > maxLength
          ? `${result.data?.content.substring(0, maxLength)}...\n\n[Content truncated - showing first ${maxLength} characters]`
          : result.data?.content;

      return {
        content: [
          {
            type: "text",
            text: `Content from ${url}:\n\n${content}`,
          },
        ],
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Fetch failed";
      throw new Error(`Web content fetch failed: ${errorMessage}`);
    }
  }

  /* istanbul ignore next */
  private setupErrorHandling(): void {
    this.server.onerror = (error) => {
      console.error("[MCP Server Error]", error);
    };

    process.on("SIGINT", async () => {
      await this.close();
      process.exit(0);
    });
  }

  /* istanbul ignore next */
  async run(): Promise<void> {
    if (this.options.transport === "stdio") {
      await this.runStdioTransport();
    } else {
      await this.runHttpTransport();
    }
  }

  /* istanbul ignore next */
  private async runStdioTransport(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("DDG Web Search MCP Server running on stdio...");
  }

  /* istanbul ignore next */
  private async runHttpTransport(): Promise<void> {
    const { port, host } = this.options;

    this.httpServer = createServer(
      async (req: IncomingMessage, res: ServerResponse) => {
        const url = new URL(req.url || "/", `http://${req.headers.host}`);

        // Handle CORS
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type");

        if (req.method === "OPTIONS") {
          res.writeHead(200);
          res.end();
          return;
        }

        if (req.method === "GET" && url.pathname === "/sse") {
          // Handle SSE connection
          await this.handleSSEConnection(req, res);
        } else if (
          req.method === "POST" &&
          url.pathname.startsWith("/message/")
        ) {
          // Handle POST messages for specific session
          const pathParts = url.pathname.split("/");
          const sessionId = pathParts[2];
          if (sessionId) {
            await this.handlePostMessage(sessionId, req, res);
          } else {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Missing session ID" }));
          }
        } else {
          // Serve basic info
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              name: "DDG Web Search MCP Server",
              version: "1.0.2",
              transport: "http",
              endpoints: {
                sse: "/sse",
                message: "/message/{sessionId}",
              },
            }),
          );
        }
      },
    );

    this.httpServer.listen(port, host, () => {
      console.error(
        `DDG Web Search MCP Server running on http://${host}:${port}`,
      );
      console.error(`SSE endpoint: http://${host}:${port}/sse`);
    });
  }

  /* istanbul ignore next */
  private async handleSSEConnection(
    req: IncomingMessage,
    res: ServerResponse,
  ): Promise<void> {
    const transport = new SSEServerTransport("/message", res);

    // Store the transport for handling POST messages
    this.activeTransports.set(transport.sessionId, transport);

    // Clean up when the connection closes
    transport.onclose = () => {
      this.activeTransports.delete(transport.sessionId);
    };

    await this.server.connect(transport);
    console.error(
      `New SSE connection established with session ID: ${transport.sessionId}`,
    );
  }

  /* istanbul ignore next */
  private async handlePostMessage(
    sessionId: string,
    req: IncomingMessage,
    res: ServerResponse,
  ): Promise<void> {
    const transport = this.activeTransports.get(sessionId);

    if (!transport) {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Session not found" }));
      return;
    }

    await transport.handlePostMessage(req, res);
  }

  /* istanbul ignore next */
  async close(): Promise<void> {
    // Close all active transports
    for (const transport of this.activeTransports.values()) {
      await transport.close();
    }
    this.activeTransports.clear();

    // Close HTTP server if running
    if (this.httpServer) {
      await new Promise<void>((resolve) => {
        this.httpServer!.close(() => resolve());
      });
    }

    await this.server.close();
  }
}

// Command line argument parsing
/* istanbul ignore next */
function parseArgs(): ServerOptions {
  const args = process.argv.slice(2);
  const options: ServerOptions = { transport: "stdio" };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case "--transport":
      case "-t":
        const transportArg = args[++i];
        if (!transportArg) {
          console.error("Missing transport type");
          process.exit(1);
        }
        const transport = transportArg as TransportType;
        if (transport === "stdio" || transport === "http") {
          options.transport = transport;
        } else {
          console.error("Invalid transport. Use 'stdio' or 'http'");
          process.exit(1);
        }
        break;
      case "--port":
      case "-p":
        const portArg = args[++i];
        if (!portArg) {
          console.error("Missing port number");
          process.exit(1);
        }
        options.port = parseInt(portArg, 10);
        if (isNaN(options.port)) {
          console.error("Invalid port number");
          process.exit(1);
        }
        break;
      case "--host":
      case "-h":
        const hostArg = args[++i];
        if (!hostArg) {
          console.error("Missing host");
          process.exit(1);
        }
        options.host = hostArg;
        break;
      case "--help":
        console.log(`
DDG Web Search MCP Server

Usage: node dist/mcp.js [options]

Options:
  -t, --transport <type>    Transport type: 'stdio' or 'http' (default: stdio)
  -p, --port <number>       Port for HTTP transport (default: 3001)
  -h, --host <string>       Host for HTTP transport (default: localhost)
  --help                    Show this help message

Examples:
  node dist/mcp.js                              # Run with stdio transport
  node dist/mcp.js --transport http             # Run with HTTP transport on default port
  node dist/mcp.js -t http -p 8080              # Run with HTTP transport on port 8080
  node dist/mcp.js -t http -h 0.0.0.0 -p 3000   # Run with HTTP transport on all interfaces
        `);
        process.exit(0);
        break;
    }
  }

  return options;
}

// Start the server
/* istanbul ignore next */
if (require.main === module) {
  const options = parseArgs();
  const server = new MCPServer(options);

  server.run().catch((error) => {
    console.error("Failed to start MCP server:", error);
    process.exit(1);
  });
}

export { MCPServer };
