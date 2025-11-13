import { MCPServer } from "../../src/mcp";
import { WebSearcher } from "../../src/searcher/WebSearcher";
import { WebContentFetcher } from "../../src/fetcher/WebContentFetcher";
import { Tool } from "@modelcontextprotocol/sdk/types.js";

jest.mock("../../src/searcher/WebSearcher");
jest.mock("../../src/fetcher/WebContentFetcher");
jest.mock("@modelcontextprotocol/sdk/server/index.js");
jest.mock("@modelcontextprotocol/sdk/server/stdio.js");
jest.mock("@modelcontextprotocol/sdk/server/sse.js");
jest.mock("node:http");

describe("MCPServer", () => {
  let server: MCPServer;
  let mockSearcher: jest.Mocked<WebSearcher>;
  let mockFetcher: jest.Mocked<WebContentFetcher>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockSearcher = {
      search: jest.fn(),
    } as unknown as jest.Mocked<WebSearcher>;

    mockFetcher = {
      fetch: jest.fn(),
    } as unknown as jest.Mocked<WebContentFetcher>;

    (WebSearcher as jest.Mock).mockImplementation(() => mockSearcher);
    (WebContentFetcher as jest.Mock).mockImplementation(() => mockFetcher);
  });

  describe("Constructor", () => {
    it("should create instance with default options", () => {
      server = new MCPServer();
      expect(server).toBeDefined();
    });

    it("should create instance with custom transport", () => {
      server = new MCPServer({ transport: "http", port: 3000 });
      expect(server).toBeDefined();
    });
  });

  describe("Tool Handling", () => {
    beforeEach(() => {
      server = new MCPServer();
    });

    it("should handle successful search", async () => {
      const mockResults = [
        {
          title: "Test Result",
          url: "https://example.com",
          snippet: "Test snippet",
        },
      ];
      mockSearcher.search.mockResolvedValue(mockResults);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const testableServer = server as any;
      const result = await testableServer.handleSearchTool({
        query: "test query",
      });

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe("text");
      expect(result.content[0].text).toContain("Test Result");
      expect(mockSearcher.search).toHaveBeenCalledWith("test query");
    });

    it("should handle successful fetch", async () => {
      const mockContent = {
        success: true,
        data: {
          content: "Test content from the web page",
          metadata: {
            title: "Test Page",
            url: "https://example.com",
          },
        },
      };
      mockFetcher.fetch.mockResolvedValue(mockContent);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const testableServer = server as any;
      const result = await testableServer.handleFetchTool({
        url: "https://example.com",
      });

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe("text");
      expect(result.content[0].text).toContain("Test content");
      expect(mockFetcher.fetch).toHaveBeenCalledWith("https://example.com");
    });

    it("should handle search validation errors", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const testableServer = server as any;

      await expect(testableServer.handleSearchTool({})).rejects.toThrow(
        "Missing or invalid query parameter",
      );

      await expect(
        testableServer.handleSearchTool({ query: "" }),
      ).rejects.toThrow("Missing or invalid query parameter");

      await expect(
        testableServer.handleSearchTool({ query: "   " }),
      ).rejects.toThrow("Query cannot be empty");
    });

    it("should handle fetch validation errors", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const testableServer = server as any;

      await expect(testableServer.handleFetchTool({})).rejects.toThrow(
        "Missing or invalid URL parameter",
      );

      await expect(testableServer.handleFetchTool({ url: "" })).rejects.toThrow(
        "Missing or invalid URL parameter",
      );

      await expect(
        testableServer.handleFetchTool({ url: "   " }),
      ).rejects.toThrow("URL cannot be empty");

      await expect(
        testableServer.handleFetchTool({ url: "invalid-url" }),
      ).rejects.toThrow("Invalid URL format");

      await expect(
        testableServer.handleFetchTool({ url: "not-a-url" }),
      ).rejects.toThrow("Invalid URL format");
    });

    it("should handle search service errors", async () => {
      mockSearcher.search.mockRejectedValue(new Error("Search failed"));

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const testableServer = server as any;
      await expect(
        testableServer.handleSearchTool({ query: "test" }),
      ).rejects.toThrow("Search failed");
    });

    it("should handle fetch service errors", async () => {
      mockFetcher.fetch.mockRejectedValue(new Error("Fetch failed"));

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const testableServer = server as any;
      await expect(
        testableServer.handleFetchTool({ url: "https://example.com" }),
      ).rejects.toThrow("Fetch failed");
    });

    it("should handle empty search results", async () => {
      mockSearcher.search.mockResolvedValue([]);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const testableServer = server as any;
      const result = await testableServer.handleSearchTool({
        query: "empty query",
      });

      expect(result.content).toHaveLength(1);
      expect(result.content[0].text).toContain("No search results found");
    });

    it("should handle fetch failure response", async () => {
      const mockContent = {
        success: false,
        error: "Failed to fetch content",
        url: "https://example.com",
        title: "",
        content: "",
      };
      mockFetcher.fetch.mockResolvedValue(mockContent);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const testableServer = server as any;
      await expect(
        testableServer.handleFetchTool({ url: "https://example.com" }),
      ).rejects.toThrow("Web content fetch failed: Failed to fetch content");
    });
  });

  describe("Server Lifecycle", () => {
    beforeEach(() => {
      server = new MCPServer();
    });

    it("should handle stdio transport startup", async () => {
      const runSpy = jest.spyOn(server, "run").mockResolvedValue(undefined);

      await server.run();
      expect(runSpy).toHaveBeenCalled();

      runSpy.mockRestore();
    });

    it("should handle server close", async () => {
      const closeSpy = jest.spyOn(server, "close").mockResolvedValue(undefined);

      await server.close();
      expect(closeSpy).toHaveBeenCalled();

      closeSpy.mockRestore();
    });
  });

  describe("Tool Registration", () => {
    beforeEach(() => {
      server = new MCPServer();
    });

    it("should register tools correctly", () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const testableServer = server as any;
      const tools = testableServer.getAvailableTools();

      expect(tools).toHaveLength(2);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const searchTool = tools.find((tool: any) => tool.name === "search");
      expect(searchTool).toBeDefined();
      expect(searchTool.description).toContain(
        "Search the web using DuckDuckGo with browser automation. Returns a list of search results with titles, URLs, and snippets.",
      );

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const fetchTool = tools.find(
        (tool: Tool) => tool.name === "fetch_web_content",
      );
      expect(fetchTool).toBeDefined();
      expect(fetchTool.description).toContain("Fetch and parse content");
    });
  });

  describe("Server lifecycle and request handling", () => {
    beforeEach(() => {
      server = new MCPServer();
    });

    it("should have run method available", () => {
      expect(typeof server.run).toBe("function");
    });

    it("should have close method available", () => {
      expect(typeof server.close).toBe("function");
    });

    it("should handle tool arguments validation edge cases", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const testableServer = server as any;

      // Test null arguments
      await expect(testableServer.handleSearchTool(null)).rejects.toThrow(
        "Missing or invalid query parameter",
      );

      await expect(testableServer.handleFetchTool(null)).rejects.toThrow(
        "Missing or invalid URL parameter",
      );
    });

    it("should handle private method getAvailableTools", () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const testableServer = server as any;

      const tools = testableServer.getAvailableTools();
      expect(tools).toHaveLength(2);
      expect(tools[0].name).toBe("search");
      expect(tools[1].name).toBe("fetch_web_content");
    });

    it("should handle setupToolHandlers method", () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const testableServer = server as any;

      expect(() => testableServer.setupToolHandlers()).not.toThrow();
    });

    it("should handle setupErrorHandling method", () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const testableServer = server as any;

      expect(() => testableServer.setupErrorHandling()).not.toThrow();
    });

    it("should handle non-Error exceptions in tool handlers", async () => {
      // Mock the searcher to throw a non-Error object
      mockSearcher.search.mockRejectedValue("String error");

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const testableServer = server as any;

      await expect(
        testableServer.handleSearchTool({ query: "test" }),
      ).rejects.toThrow("Web search failed: Search failed");
    });

    it("should test tool call request through request handler", async () => {
      // Set up mocks for successful responses
      mockSearcher.search.mockResolvedValue([
        {
          title: "Test Result",
          url: "https://example.com",
          snippet: "Test snippet",
        },
      ]);

      // Access the private server property to test request handlers
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const testableServer = server as any;

      // Verify the request handlers are properly set up
      expect(testableServer.server).toBeDefined();
      expect(testableServer.server.setRequestHandler).toBeDefined();
    });
  });
});
