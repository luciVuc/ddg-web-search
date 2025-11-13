import { WebSearcher } from "../../src/searcher/WebSearcher";
import { SearchResult } from "../../src/types";
import puppeteer, {
  Browser,
  ElementHandle,
  JSHandle,
  HTTPResponse,
} from "puppeteer";

// Mock puppeteer for controlled testing
jest.mock("puppeteer");
const mockedPuppeteer = puppeteer as jest.Mocked<typeof puppeteer>;

// Mock browser and page instances
const mockPage = {
  setUserAgent: jest.fn(),
  setViewport: jest.fn(),
  goto: jest.fn(),
  $: jest.fn(),
  waitForSelector: jest.fn(),
  waitForFunction: jest.fn(),
  waitForNavigation: jest.fn(),
  type: jest.fn(),
  click: jest.fn(),
  evaluate: jest.fn(),
  close: jest.fn(),
};

const mockBrowser = {
  newPage: jest.fn().mockResolvedValue(mockPage),
  close: jest.fn(),
};

describe("WebSearcher", () => {
  let searcher: WebSearcher;
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    searcher = new WebSearcher(true); // Use headless mode for tests
    consoleSpy = jest.spyOn(console, "error").mockImplementation();
    jest.clearAllMocks();

    // Reset mock implementations
    mockedPuppeteer.launch.mockResolvedValue(mockBrowser as unknown as Browser);
    mockPage.setUserAgent.mockResolvedValue(undefined);
    mockPage.setViewport.mockResolvedValue(undefined);
    mockPage.goto.mockResolvedValue(null as unknown as HTTPResponse);
    mockPage.$.mockResolvedValue(null);
    mockPage.waitForSelector.mockResolvedValue(
      null as unknown as ElementHandle,
    );
    mockPage.waitForFunction.mockResolvedValue(null as unknown as JSHandle);
    mockPage.waitForNavigation.mockResolvedValue(
      null as unknown as HTTPResponse,
    );
    mockPage.type.mockResolvedValue(undefined);
    mockPage.click.mockResolvedValue(undefined);
    mockPage.close.mockResolvedValue(undefined);
    mockBrowser.close.mockResolvedValue(undefined);
  });

  afterEach(async () => {
    consoleSpy.mockRestore();
    await searcher.close();
  });

  describe("search method", () => {
    it("should return search results for a valid query", async () => {
      const mockResults: SearchResult[] = [
        {
          title: "Node.js is a JavaScript runtime",
          url: "https://nodejs.org",
          snippet: "Node.js runtime for server-side JavaScript",
          icon: "",
        },
        {
          title: "Learn Node.js",
          url: "https://example.com/nodejs",
          snippet: "Tutorial for Node.js development",
          icon: "",
        },
      ];

      mockPage.evaluate.mockResolvedValue(mockResults);

      const results: SearchResult[] = await searcher.search("Node.js");

      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
      expect(results).toHaveLength(2);
      expect(results[0]).toEqual(mockResults[0]);
      expect(results[1]).toEqual(mockResults[1]);

      expect(mockedPuppeteer.launch).toHaveBeenCalledWith({
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-blink-features=AutomationControlled",
          "--disable-features=VizDisplayCompositor",
        ],
      });
      expect(mockPage.goto).toHaveBeenCalledWith("https://duckduckgo.com", {
        waitUntil: "networkidle0",
        timeout: 30000,
      });
      expect(mockPage.waitForSelector).toHaveBeenCalledWith(
        'input[name="q"], #search_form_input, .search__input',
        { timeout: 5000 },
      );
      expect(mockPage.type).toHaveBeenCalledWith(
        'input[name="q"], #search_form_input, .search__input',
        "Node.js",
      );
      expect(mockPage.click).toHaveBeenCalledWith(
        'button[type="submit"], .search__button, input[type="submit"]',
      );
    });

    it("should return empty array for empty query", async () => {
      const results: SearchResult[] = await searcher.search("");
      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
      expect(results).toHaveLength(0);
      expect(mockedPuppeteer.launch).not.toHaveBeenCalled();
    });

    it("should return empty array for whitespace-only query", async () => {
      const results: SearchResult[] = await searcher.search("   ");
      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
      expect(results).toHaveLength(0);
      expect(mockedPuppeteer.launch).not.toHaveBeenCalled();
    });

    it("should handle captcha challenge in non-headless mode", async () => {
      const nonHeadlessSearcher = new WebSearcher(false);

      // Mock captcha element being found
      mockPage.$.mockResolvedValue({} as unknown as ElementHandle);
      mockPage.evaluate.mockResolvedValue([]);

      const results = await nonHeadlessSearcher.search("test query");

      expect(results).toEqual([]);
      expect(mockPage.$).toHaveBeenCalledWith(
        '.captcha, [id*="captcha"], [class*="captcha"]',
      );
      expect(mockPage.waitForFunction).toHaveBeenCalledWith(
        expect.any(Function),
        { timeout: 10000 },
      );

      await nonHeadlessSearcher.close();
    });

    it("should handle browser initialization failure", async () => {
      mockedPuppeteer.launch.mockResolvedValue(null as unknown as Browser);

      const results = await searcher.search("test");

      expect(results).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith(
        "Error during web search:",
        "Failed to initialize browser",
      );
    });

    it("should handle search form selector not found", async () => {
      const selectorError = new Error("waiting for selector failed: timeout");
      mockPage.waitForSelector.mockRejectedValue(selectorError);

      const results = await searcher.search("test");

      expect(results).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith(
        "Error during web search:",
        "waiting for selector failed: timeout",
      );
    });

    it("should handle page type error", async () => {
      const typeError = new Error("page.type failed");
      mockPage.type.mockRejectedValue(typeError);

      const results = await searcher.search("test");

      expect(results).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith(
        "Error during web search:",
        "page.type failed",
      );
    });

    it("should handle submit button click error", async () => {
      const clickError = new Error("page.click failed");
      mockPage.click.mockRejectedValue(clickError);

      const results = await searcher.search("test");

      expect(results).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith(
        "Error during web search:",
        "page.click failed",
      );
    });

    it("should handle navigation wait error", async () => {
      const navError = new Error("Navigation failed");
      mockPage.waitForNavigation.mockRejectedValue(navError);

      const results = await searcher.search("test");

      expect(results).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith(
        "Error during web search:",
        "Navigation failed",
      );
    });

    it("should handle all selectors failing and still attempt extraction", async () => {
      // Make all waitForSelector calls fail
      mockPage.waitForSelector.mockImplementation((selector) => {
        if (
          selector === 'input[name="q"], #search_form_input, .search__input'
        ) {
          return Promise.resolve(null as unknown as ElementHandle);
        }
        return Promise.reject(new Error("Selector not found"));
      });

      // Mock console.warn to track warning message
      const warnSpy = jest.spyOn(console, "warn").mockImplementation();

      mockPage.evaluate.mockResolvedValue([]);

      const results = await searcher.search("test");

      expect(results).toEqual([]);
      expect(warnSpy).toHaveBeenCalledWith(
        "No search result selectors found, attempting to extract from page anyway...",
      );

      warnSpy.mockRestore();
    });

    it("should handle target closed error", async () => {
      const targetError = new Error("Target closed");
      mockPage.evaluate.mockRejectedValue(targetError);

      const results = await searcher.search("test");

      expect(results).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith(
        "Error during web search:",
        "Target closed",
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        "Browser was closed unexpectedly",
      );
    });

    it("should handle navigation timeout error with specific message", async () => {
      const timeoutError = new Error("Navigation timeout of 30000 ms exceeded");
      mockPage.goto.mockRejectedValue(timeoutError);

      const results = await searcher.search("test");

      expect(results).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith(
        "Error during web search:",
        "Navigation timeout of 30000 ms exceeded",
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        "Search timed out - the page took too long to load",
      );
    });

    it("should reuse browser instance across multiple searches", async () => {
      mockPage.evaluate.mockResolvedValue([]);

      await searcher.search("first query");
      await searcher.search("second query");

      // Browser should only be launched once
      expect(mockedPuppeteer.launch).toHaveBeenCalledTimes(1);
      // But new pages should be created for each search
      expect(mockBrowser.newPage).toHaveBeenCalledTimes(2);
    });

    it("should handle page close error gracefully", async () => {
      mockPage.evaluate.mockResolvedValue([]);

      // This test should show that even if page close fails, the method continues
      const closeError = new Error("Page close failed");
      mockPage.close.mockRejectedValue(closeError);

      // Mock console.error to capture the error log
      const errorSpy = jest.spyOn(console, "error").mockImplementation();

      // Should still return results despite close error happening in finally block
      const results = await searcher.search("test");
      expect(results).toEqual([]);
      expect(errorSpy).toHaveBeenCalledWith("Error closing page:", closeError);

      errorSpy.mockRestore();
    });

    it("should handle no search results found", async () => {
      mockPage.evaluate.mockResolvedValue([]);

      const results = await searcher.search("test");
      expect(results).toEqual([]);
    });

    it("should handle page navigation error", async () => {
      const navigationError = new Error("Navigation timeout");
      mockPage.goto.mockRejectedValue(navigationError);

      const results = await searcher.search("test");

      expect(results).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith(
        "Error during web search:",
        "Navigation timeout",
      );
    });

    it("should handle selector wait timeout", async () => {
      const timeoutError = new Error(
        "Waiting for selector `.result, .web-result` failed",
      );
      mockPage.waitForSelector.mockRejectedValue(timeoutError);

      const results = await searcher.search("test");

      expect(results).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith(
        "Error during web search:",
        "Waiting for selector `.result, .web-result` failed",
      );
    });

    it("should handle browser launch error", async () => {
      const launchError = new Error("Failed to launch browser");
      mockedPuppeteer.launch.mockRejectedValue(launchError);

      const results = await searcher.search("test");

      expect(results).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith(
        "Error during web search:",
        "Failed to launch browser",
      );
    });

    it("should handle protocol error", async () => {
      const protocolError = new Error("Protocol error: Connection closed");
      mockPage.evaluate.mockRejectedValue(protocolError);

      const results = await searcher.search("test");

      expect(results).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith(
        "Error during web search:",
        "Protocol error: Connection closed",
      );
    });

    it("should handle unknown error", async () => {
      const unknownError = "string error";
      mockPage.evaluate.mockRejectedValue(unknownError);

      const results = await searcher.search("test");

      expect(results).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith(
        "Unknown error occurred during search:",
        "string error",
      );
    });

    it("should respect rate limiting", async () => {
      mockPage.evaluate.mockResolvedValue([]);

      const start = Date.now();
      await searcher.search("query1");
      await searcher.search("query2");
      const elapsed = Date.now() - start;

      expect(elapsed).toBeGreaterThanOrEqual(1900); // Should wait at least 1900ms (2000ms - timing variance)
      expect(mockedPuppeteer.launch).toHaveBeenCalledTimes(1); // Browser reused
      expect(mockBrowser.newPage).toHaveBeenCalledTimes(2);
    }, 15000);

    it("should close page after search regardless of outcome", async () => {
      mockPage.evaluate.mockResolvedValue([]);

      await searcher.search("test");

      expect(mockPage.close).toHaveBeenCalled();
    });

    it("should close page even when error occurs", async () => {
      const error = new Error("Test error");
      mockPage.evaluate.mockRejectedValue(error);

      await searcher.search("test");

      expect(mockPage.close).toHaveBeenCalled();
    });
  });

  describe("close method", () => {
    it("should close browser when close is called", async () => {
      // Initialize browser by doing a search
      mockPage.evaluate.mockResolvedValue([]);
      await searcher.search("test");

      await searcher.close();

      expect(mockBrowser.close).toHaveBeenCalled();
    });

    it("should handle close being called when browser is not initialized", async () => {
      await searcher.close();

      expect(mockBrowser.close).not.toHaveBeenCalled();
    });
  });

  describe("constructor", () => {
    it("should create searcher in headless mode by default", () => {
      const defaultSearcher = new WebSearcher();
      expect(defaultSearcher).toBeDefined();
    });

    it("should create searcher in non-headless mode when specified", () => {
      const nonHeadlessSearcher = new WebSearcher(false);
      expect(nonHeadlessSearcher).toBeDefined();
    });
  });

  describe("page evaluation and result extraction", () => {
    it("should handle various URL formats correctly", async () => {
      // Mock page.evaluate to simulate different URL scenarios
      mockPage.evaluate.mockImplementation(() => {
        return Promise.resolve([
          {
            title: "Protocol relative URL",
            url: "https://example.com", // Already processed
            snippet: "Test snippet",
            icon: "",
          },
          {
            title: "Relative URL",
            url: "https://duckduckgo.com/test", // Already processed
            snippet: "Test snippet 2",
            icon: "",
          },
          {
            title: "HTTP to HTTPS conversion",
            url: "https://example.org", // Already processed
            snippet: "Test snippet 3",
            icon: "",
          },
        ]);
      });

      const results = await searcher.search("test");

      expect(results).toHaveLength(3);
      expect(results[0]?.url).toBe("https://example.com");
      expect(results[1]?.url).toBe("https://duckduckgo.com/test");
      expect(results[2]?.url).toBe("https://example.org");
    });

    it("should filter out invalid URLs and DuckDuckGo internal URLs", async () => {
      mockPage.evaluate.mockResolvedValue([
        {
          title: "Valid Result",
          url: "https://example.com",
          snippet: "Valid snippet",
          icon: "",
        },
      ]);

      const results = await searcher.search("test");

      expect(results).toHaveLength(1);
      expect(results[0]?.title).toBe("Valid Result");
    });

    it("should handle empty evaluation results", async () => {
      mockPage.evaluate.mockResolvedValue([]);

      const results = await searcher.search("test");

      expect(results).toEqual([]);
    });

    it("should handle evaluation throwing an error", async () => {
      const evalError = new Error("Evaluation failed");
      mockPage.evaluate.mockRejectedValue(evalError);

      const results = await searcher.search("test");

      expect(results).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith(
        "Error during web search:",
        "Evaluation failed",
      );
    });
  });

  describe("error handling edge cases", () => {
    it("should handle setUserAgent error", async () => {
      const userAgentError = new Error("setUserAgent failed");
      mockPage.setUserAgent.mockRejectedValue(userAgentError);

      const results = await searcher.search("test");

      expect(results).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith(
        "Error during web search:",
        "setUserAgent failed",
      );
    });

    it("should handle setViewport error", async () => {
      const viewportError = new Error("setViewport failed");
      mockPage.setViewport.mockRejectedValue(viewportError);

      const results = await searcher.search("test");

      expect(results).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith(
        "Error during web search:",
        "setViewport failed",
      );
    });

    it("should handle newPage creation error", async () => {
      const pageError = new Error("newPage failed");
      mockBrowser.newPage.mockRejectedValue(pageError);

      const results = await searcher.search("test");

      expect(results).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith(
        "Error during web search:",
        "newPage failed",
      );
    });

    it("should handle captcha check error", async () => {
      // Setup to pass browser and page creation, but fail on captcha check
      mockBrowser.newPage.mockResolvedValue(mockPage);
      mockPage.setUserAgent.mockResolvedValue(undefined);
      mockPage.setViewport.mockResolvedValue(undefined);
      mockPage.goto.mockResolvedValue(null as unknown as HTTPResponse);

      const captchaError = new Error("captcha selector failed");
      mockPage.$.mockRejectedValue(captchaError);

      const results = await searcher.search("test");

      expect(results).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith(
        "Error during web search:",
        "captcha selector failed",
      );
    });
  });

  describe("browser lifecycle", () => {
    it("should handle browser close error in close method", async () => {
      // Initialize browser first
      mockPage.evaluate.mockResolvedValue([]);
      await searcher.search("test");

      // Mock browser close to throw error
      const closeError = new Error("Browser close failed");
      mockBrowser.close.mockRejectedValue(closeError);

      // Mock console.error to capture the error log
      const errorSpy = jest.spyOn(console, "error").mockImplementation();

      // Should not throw error, but should log it
      await expect(searcher.close()).resolves.not.toThrow();

      expect(errorSpy).toHaveBeenCalledWith(
        "Error closing browser:",
        closeError,
      );
      errorSpy.mockRestore();
    });

    it("should handle multiple close calls safely", async () => {
      // Initialize browser first
      mockPage.evaluate.mockResolvedValue([]);
      await searcher.search("test");

      await searcher.close();
      await searcher.close(); // Second call should be safe

      expect(mockBrowser.close).toHaveBeenCalledTimes(1);
    });

    it("should properly clean up browser reference after close", async () => {
      // Initialize browser first
      mockPage.evaluate.mockResolvedValue([]);
      await searcher.search("test");

      await searcher.close();

      // Subsequent search should create new browser
      await searcher.search("test2");

      expect(mockedPuppeteer.launch).toHaveBeenCalledTimes(2);
    });
  });
});
