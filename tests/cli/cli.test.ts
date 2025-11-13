import { CLI } from "../../src/cli";
import { WebSearcher } from "../../src/searcher/WebSearcher";
import { WebContentFetcher } from "../../src/fetcher/WebContentFetcher";

// Mock the WebSearcher
jest.mock("../../src/searcher/WebSearcher");
const MockedWebSearcher = WebSearcher as jest.MockedClass<typeof WebSearcher>;

// Mock the WebContentFetcher
jest.mock("../../src/fetcher/WebContentFetcher");
const MockedWebContentFetcher = WebContentFetcher as jest.MockedClass<
  typeof WebContentFetcher
>;

describe("CLI", () => {
  let cli: CLI;
  let consoleSpy: jest.SpyInstance;
  let mockSearcher: jest.Mocked<WebSearcher>;
  let mockFetcher: jest.Mocked<WebContentFetcher>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock searcher
    mockSearcher = {
      search: jest.fn(),
      close: jest.fn(),
    } as unknown as jest.Mocked<WebSearcher>;

    // Setup mock fetcher
    mockFetcher = {
      fetch: jest.fn(),
    } as unknown as jest.Mocked<WebContentFetcher>;

    MockedWebSearcher.mockImplementation(() => mockSearcher);
    MockedWebContentFetcher.mockImplementation(() => mockFetcher);

    // Mock successful search results
    mockSearcher.search.mockResolvedValue([
      {
        title: "Test Result",
        url: "https://example.com",
        snippet: "Test snippet",
        icon: "",
      },
    ]);

    // Mock successful fetch result
    mockFetcher.fetch.mockResolvedValue({
      success: true,
      data: {
        content: "Test content",
        metadata: {
          title: "Test Page",
          description: "Test description",
          url: "https://httpbin.org/html",
        },
      },
    });

    cli = new CLI();
    consoleSpy = jest.spyOn(console, "log").mockImplementation();
  });

  afterEach(async () => {
    consoleSpy.mockRestore();
    // Ensure searcher cleanup is called
    if (mockSearcher?.close) {
      await mockSearcher.close();
    }
  });

  describe("search command", () => {
    it("should handle search with valid query", async () => {
      await cli.search("test query");
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Searching for: "test query"'),
      );
      expect(mockSearcher.search).toHaveBeenCalledWith("test query");
    }, 10000);

    it("should handle empty search query", async () => {
      await cli.search("");
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Search query cannot be empty"),
      );
    });

    it("should handle search query with only whitespace", async () => {
      await cli.search("   ");
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Search query cannot be empty"),
      );
    });
  });

  describe("fetch command", () => {
    it("should handle fetch with valid URL", async () => {
      await cli.fetch("https://httpbin.org/html");
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          "Fetching content from: https://httpbin.org/html",
        ),
      );
      expect(mockFetcher.fetch).toHaveBeenCalledWith(
        "https://httpbin.org/html",
      );
    }, 15000);

    it("should handle empty URL", async () => {
      await cli.fetch("");
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("URL cannot be empty"),
      );
    });

    it("should handle invalid URL", async () => {
      await cli.fetch("invalid-url");
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Invalid URL format"),
      );
    });

    it("should handle URL with only whitespace", async () => {
      await cli.fetch("   ");
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("URL cannot be empty"),
      );
    });
  });

  describe("run command", () => {
    it("should show help when no arguments provided", async () => {
      await cli.run([]);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Available Commands:"),
      );
    });

    it("should handle help command", async () => {
      await cli.run(["help"]);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Available Commands:"),
      );
    });

    it("should handle version command", async () => {
      await cli.run(["version"]);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("📦 Package: ddg-web-search"),
      );
    });

    it("should handle unknown command", async () => {
      await cli.run(["unknown"]);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Unknown command: unknown"),
      );
    });

    it("should handle search command with argument", async () => {
      await cli.run(["search", "test", "query"]);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Searching for: "test query"'),
      );
      expect(mockSearcher.search).toHaveBeenCalledWith("test query");
    }, 10000);

    it("should handle search command without argument", async () => {
      await cli.run(["search"]);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Usage: ddg-web-search search <query>"),
      );
    });

    it("should handle fetch command with argument", async () => {
      await cli.run(["fetch", "https://httpbin.org/html"]);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          "Fetching content from: https://httpbin.org/html",
        ),
      );
      expect(mockFetcher.fetch).toHaveBeenCalledWith(
        "https://httpbin.org/html",
      );
    }, 15000);

    it("should handle fetch command without argument", async () => {
      await cli.run(["fetch"]);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Usage: ddg-web-search fetch <url>"),
      );
    });
  });
});
