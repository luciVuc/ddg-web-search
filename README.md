# DDG Web Search

A comprehensive package for searching the web and fetching web content programmatically, through a CLI interface, or through a Model Context Protocol (MCP) server.

## Features

- **🔍 Web Searcher**: Search the web using DuckDuckGo with browser automation for reliable results
- **📄 Web Content Fetcher**: Fetch and parse content from web pages with intelligent scraping
- **⚡ MCP Server**: Model Context Protocol server with both stdio and HTTP (SSE) transport support
- **💻 Command Line Interface**: Interactive CLI for searching and fetching content from the terminal
- **🛡️ Rate Limiting**: Automatic request rate management to avoid hitting API limits
- **🔧 Error Handling**: Robust error handling for browser automation, HTTP requests and network issues
- **📝 TypeScript Support**: Full TypeScript support with comprehensive type definitions
- **🤖 Browser Automation**: Uses Puppeteer for reliable web interaction and JavaScript rendering

## Installation

To install the package globally for CLI and MCP usage:

```bash
npm install -g @lucid-spark/ddg-web-search
```

Or install locally in your project:

```bash
npm install @lucid-spark/ddg-web-search
```

For MCP server dependencies (automatically included):

```bash
npm install @modelcontextprotocol/sdk puppeteer
```

## Key Dependencies

- **Puppeteer**: For reliable browser automation and JavaScript rendering
- **Axios**: For HTTP requests in web content fetching
- **Cheerio**: For HTML parsing and content extraction
- **Turndown**: For converting HTML to Markdown
- **MCP SDK**: For Model Context Protocol server functionality

## MCP Server Usage

The package includes a Model Context Protocol (MCP) server that exposes the search and web content fetching as tools for AI assistants. The server supports both **stdio** and **HTTP** transports.

### Available MCP Tools

1. **search**: Search the web using DuckDuckGo with browser automation
   - Input: `{ "query": "search terms" }`
   - Returns: Formatted list of search results with titles, URLs, and snippets
   - Features: Captcha handling, anti-detection measures, JavaScript rendering

2. **fetch_web_content**: Fetch and parse content from a web URL with intelligent scraping
   - Input: `{ "url": "https://example.com" }`
   - Returns: Parsed text content with metadata (content truncated to 10,000 characters if needed)
   - Features: HTML-to-Markdown conversion, metadata extraction, content cleaning

### Running the MCP Server

#### Stdio Transport (Default)

```bash
# Using global binary (after global install)
ddg-web-search-mcp

# Using npx
npx @lucid-spark/ddg-web-search mcp

# Using built files
npm run build
node dist/mcp.js
```

#### HTTP Transport

```bash
# Development mode with HTTP transport
npm run mcp:http

# Production mode with HTTP transport
npm run mcp:http:build

# Or manually with custom port/host
node dist/mcp.js --transport http --port 3001 --host localhost
```

### MCP Configuration

#### For Stdio Transport (Default)

Add to your MCP client configuration (e.g., Claude Desktop):

```json
{
  "mcpServers": {
    "ddg-web-search": {
      "command": "ddg-web-search-mcp",
      "args": [],
      "env": {}
    }
  }
}
```

Or using npx:

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

#### For HTTP Transport

Start the HTTP server and configure your MCP client to connect to the HTTP endpoint:

```bash
# Start HTTP server (default port 3001)
npm run mcp:http:build

# Server will be available at:
# - Server info: http://localhost:3001/
# - SSE endpoint: http://localhost:3001/sse
# - Message endpoint: http://localhost:3001/message/{sessionId}
```

#### Testing HTTP Transport

A test HTML client is available at `examples/http-client.html` to demonstrate HTTP transport functionality. Start the HTTP server and open the HTML file in a browser to test the connection.

#### Command Line Options

```bash
# Show help
node dist/mcp.js --help

# Available options:
# -t, --transport <type>    Transport type: 'stdio' or 'http' (default: stdio)
# -p, --port <number>      Port for HTTP transport (default: 3001)
# -h, --host <string>      Host for HTTP transport (default: localhost)
```

### HTTP Transport Endpoints

When using HTTP transport, the server provides:

- **Server Info**: `GET /` - Returns server information and available endpoints
- **SSE Connection**: `GET /sse` - Establishes Server-Sent Events connection for receiving responses
- **Message Sending**: `POST /message/{sessionId}` - Sends MCP requests to the server

Example HTTP endpoints:

```
GET http://localhost:3001/         # Server info
GET http://localhost:3001/sse      # SSE connection
POST http://localhost:3001/message/{sessionId}  # Send messages
```

## CLI Usage

After global installation, you can use the CLI with these commands:

### Basic Commands

```bash
# Search the web
ddg-web-search search "TypeScript tutorials"

# Fetch content from a URL
ddg-web-search fetch https://example.com

# Start interactive mode
ddg-web-search interactive

# Start MCP server (stdio transport)
ddg-web-search mcp

# Start MCP server (HTTP transport)
ddg-web-search mcp-http

# Show help
ddg-web-search help

# Show version
ddg-web-search version
```

### Interactive Mode

Start interactive mode for a more engaging experience:

```bash
ddg-web-search interactive
```

In interactive mode, you can use these commands:

- `search <query>` or `s <query>` - Search the web
- `fetch <url>` or `f <url>` - Fetch web content
- `mcp` - Start MCP server (stdio transport)
- `mcp-http` - Start MCP server (HTTP transport)
- `help` or `h` - Show help
- `version` or `v` - Show version
- `clear` or `cls` - Clear screen
- `exit` or `quit` or `q` - Exit interactive mode

### CLI Examples

```bash
# Search for JavaScript tutorials
ddg-web-search search "JavaScript tutorials"

# Fetch content from a specific URL
ddg-web-search fetch https://httpbin.org/html

# Start interactive session
ddg-web-search interactive

# Start MCP server with stdio transport
ddg-web-search mcp

# Start MCP server with HTTP transport
ddg-web-search mcp-http

# Get help
ddg-web-search help
```

## Programmatic API Usage

### Basic Example

Here's a simple example of how to use the WebSearcher and WebContentFetcher:

```typescript
import { WebSearcher, WebContentFetcher } from "@lucid-spark/ddg-web-search";

async function main() {
  const searcher = new WebSearcher();
  const fetcher = new WebContentFetcher();

  try {
    // Search the web (uses Puppeteer browser automation with DuckDuckGo)
    const results = await searcher.search("TypeScript");
    console.log("Search Results:", results);

    // Fetch content from the first result (if available)
    if (results.length > 0) {
      const fetchResult = await fetcher.fetch(results[0].url);
      if (fetchResult.success && fetchResult.data?.content) {
        console.log("Content Length:", fetchResult.data.content.length);
        console.log("Page Title:", fetchResult.data.metadata?.title);
      }
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    // Important: Close browser to free resources
    await searcher.close();
  }
}

main();
```

### Using the MCP Server Programmatically

```typescript
import { MCPServer } from "@lucid-spark/ddg-web-search/dist/mcp";

async function runMCPServer() {
  const server = new MCPServer();
  await server.run();
  // Server will handle MCP requests via stdio
}

runMCPServer();
```

## API Reference

### WebSearcher

#### Constructor

```typescript
new WebSearcher(headless?: boolean);
```

- `headless` (optional): Whether to run browser in headless mode (default: `true`)
  - Set to `false` for debugging or manual captcha solving

#### Methods

- `search(query: string): Promise<SearchResult[]>`: Searches DuckDuckGo using browser automation and returns an array of search results. Thread-safe with built-in initialization mutex to prevent race conditions.
- `close(): Promise<void>`: Closes the browser instance and frees resources (important for memory management)

### WebContentFetcher

#### Constructor

```typescript
new WebContentFetcher(rateLimit?: number, rateLimitInterval?: number);
```

- `rateLimit` (optional): Number of requests allowed per interval (default: 1)
- `rateLimitInterval` (optional): Time interval in milliseconds (default: 1000)

#### Methods

- `fetch(url: string): Promise<FetchResult>`: Fetches and returns the content of the specified URL

### CLI

#### Constructor

```typescript
new CLI();
```

#### Methods

- `run(args: string[]): Promise<void>`: Run CLI with command line arguments
- `search(query: string): Promise<void>`: Perform a search and display results
- `fetch(url: string): Promise<void>`: Fetch content from URL and display
- `interactive(): Promise<void>`: Start interactive mode

### MCPServer

#### Constructor

```typescript
new MCPServer();
```

#### Methods

- `run(): Promise<void>`: Start the MCP server listening on stdio

### Types

#### SearchResult

```typescript
interface SearchResult {
  title: string; // The title of the search result
  url: string; // The URL of the search result
  snippet: string; // A brief description or snippet
  icon?: string; // Optional icon URL for the result
}
```

#### FetchResult

```typescript
interface FetchResult {
  success: boolean; // Whether the fetch was successful
  data?: WebContent; // Parsed web content (if available)
  error?: string; // Error message (if failed)
}
```

#### WebContent

```typescript
interface WebContent {
  content: string; // Main content of the page (HTML converted to Markdown)
  metadata?: {
    // Optional metadata extracted from the page
    title?: string; // Page title
    description?: string; // Page description
    url?: string; // Page URL
    author?: string; // Page author
    publishDate?: string; // Publication date
  };
}
```

## Development

### Configuration Constants

The package uses the following configurable constants:

**WebSearcher**:

- `RATE_LIMIT_INTERVAL_MS`: 2000ms (1 request per 2 seconds)
- `NAVIGATION_TIMEOUT_MS`: 30000ms (30 seconds for page navigation)
- `SELECTOR_WAIT_TIMEOUT_MS`: 5000ms (5 seconds for selector waiting)
- `CAPTCHA_MANUAL_SOLVE_TIMEOUT_MS`: 60000ms (60 seconds for manual captcha solving)

**HttpClient**:

- `DEFAULT_TIMEOUT_MS`: 10000ms (10 seconds for HTTP requests)

**MCP Server**:

- `MAX_CONTENT_LENGTH`: 10000 characters (content truncation limit)
- `DEFAULT_HTTP_PORT`: 3001 (HTTP transport default port)

**CLI**:

- `CONTENT_PREVIEW_LENGTH`: 500 characters (preview display limit)

### Building the Project

```bash
npm run build
```

### Running Tests

```bash
npm test
```

### Development Scripts

```bash
# Run example usage
npm run dev

# Test the package functionality
npm run test-package

# Run CLI in development mode
npm run cli help

# Run MCP server with stdio transport (development mode)
npm run mcp

# Run MCP server with HTTP transport (development mode)
npm run mcp:http

# Build and run compiled CLI
npm run cli:build help

# Build and run compiled MCP server with stdio transport
npm run mcp:build

# Build and run compiled MCP server with HTTP transport
npm run mcp:http:build
```

## Rate Limiting

Both the WebSearcher and WebContentFetcher include built-in rate limiting to prevent overwhelming servers:

- **WebSearcher**: 1 request per 2 seconds (2000ms) by default - conservative timing for browser automation
- **WebContentFetcher**: Configurable rate limiting (1 request per 1000ms by default)

## Error Handling

The package includes comprehensive error handling:

- Network errors are caught and logged
- Invalid URLs are handled gracefully
- Rate limiting is enforced automatically
- HTTP errors are properly typed and handled
- MCP server errors are returned as structured error responses
- Browser automation errors (timeouts, captcha detection, connection issues) are handled gracefully
- Captcha detection: Returns empty results in headless mode; waits up to 60 seconds for manual solving in non-headless mode
- Resource cleanup ensures no memory leaks from browser instances
- Thread-safe browser initialization prevents race conditions

**Important Note**: Always call `searcher.close()` when done with WebSearcher to properly cleanup browser resources and prevent memory leaks.

## CLI Features

The CLI provides a rich, colorful interface with:

- 🎨 **Colorful Output**: Different colors for different types of messages
- 🔍 **Search Functionality**: Search the web directly from the terminal using browser automation
- 📥 **Content Fetching**: Fetch and preview web content with intelligent parsing
- 🎯 **Interactive Mode**: Engaging interactive session with command history
- 📖 **Comprehensive Help**: Built-in help system with examples
- ⚡ **Fast Performance**: Built with TypeScript for optimal performance
- 🧹 **Resource Management**: Automatic cleanup of browser resources

## MCP Integration

The Model Context Protocol server enables AI assistants to:

- 🔍 **Search the Web**: Use the web with advanced browser automation for JavaScript-rendered content
- 📄 **Fetch Content**: Retrieve and parse content from web pages with intelligent scraping
- 🚀 **Dual Transport Support**: Supports both stdio and HTTP (SSE) transports
- ⚡ **Rate Limited**: Automatic rate limiting prevents API abuse
- 🛡️ **Error Handling**: Graceful error handling with structured responses
- 📡 **Standards Compliant**: Follows MCP specification for AI assistant integration
- 🤖 **Captcha Aware**: Handles captcha challenges intelligently
- 🧹 **Resource Efficient**: Proper cleanup of browser instances

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any improvements or bug fixes.

### Development Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Build the project: `npm run build`
4. Run tests: `npm test`
5. Test CLI: `npm run cli help`
6. Test MCP server: `npm run mcp`

## License

This project is licensed under the MIT License. See the LICENSE file for details.
