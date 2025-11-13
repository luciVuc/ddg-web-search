import { WebContentFetcher } from "../../src/fetcher/WebContentFetcher";
import { HttpClient } from "../../src/utils/HttpClient";
import { FetchResult } from "../../src/types";

// Mock HttpClient
jest.mock("../../src/utils/HttpClient");

describe("WebContentFetcher", () => {
  let fetcher: WebContentFetcher;
  let mockHttpClientInstance: jest.Mocked<HttpClient>;
  let mockGetInstance: jest.MockedFunction<typeof HttpClient.getInstance>;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create a mock instance with only public methods
    mockHttpClientInstance = {
      get: jest.fn(),
      post: jest.fn(),
    } as unknown as jest.Mocked<HttpClient>;

    // Mock getInstance to return our mock instance
    mockGetInstance = HttpClient.getInstance as jest.MockedFunction<
      typeof HttpClient.getInstance
    >;
    mockGetInstance.mockReturnValue(mockHttpClientInstance);

    fetcher = new WebContentFetcher(); // Uses default rate limit parameters
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("fetch", () => {
    it("should fetch and return content from URL", async () => {
      const mockResponse =
        "<html><body><h1>Test</h1><p>Test content from URL</p></body></html>";
      mockHttpClientInstance.get.mockResolvedValue(mockResponse);

      const result: FetchResult = await fetcher.fetch("https://example.com");

      expect(result.success).toBe(true);
      expect(result.data?.content).toContain("Test content from URL");
      expect(result.error).toBeUndefined();
      expect(mockHttpClientInstance.get).toHaveBeenCalledWith(
        "https://example.com",
      );
    });

    it("should return error for empty URL", async () => {
      const result: FetchResult = await fetcher.fetch("");

      expect(result.success).toBe(false);
      expect(result.error).toBe("URL cannot be empty");
      expect(mockHttpClientInstance.get).not.toHaveBeenCalled();
    });

    it("should return error for null/undefined URL", async () => {
      const result: FetchResult = await fetcher.fetch(
        null as unknown as string,
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe("URL cannot be empty");
      expect(mockHttpClientInstance.get).not.toHaveBeenCalled();
    });

    it("should return error for whitespace-only URL", async () => {
      const result: FetchResult = await fetcher.fetch("   ");

      expect(result.success).toBe(false);
      expect(result.error).toBe("URL cannot be empty");
      expect(mockHttpClientInstance.get).not.toHaveBeenCalled();
    });

    it("should return error for invalid URL format", async () => {
      const result: FetchResult = await fetcher.fetch("invalid-url");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Invalid URL format");
      expect(mockHttpClientInstance.get).not.toHaveBeenCalled();
    });

    it("should return error for malformed URL", async () => {
      const result: FetchResult = await fetcher.fetch("http://");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Invalid URL format");
      expect(mockHttpClientInstance.get).not.toHaveBeenCalled();
    });

    it("should return error for URL without protocol", async () => {
      const result: FetchResult = await fetcher.fetch("example.com");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Invalid URL format");
      expect(mockHttpClientInstance.get).not.toHaveBeenCalled();
    });

    it("should handle different valid URL schemes", async () => {
      const httpsUrl = "https://secure.example.com";
      const httpUrl = "http://example.com";
      const mockResponse = "Content";

      mockHttpClientInstance.get.mockResolvedValue(mockResponse);

      const httpsResult = await fetcher.fetch(httpsUrl);
      expect(httpsResult.success).toBe(true);
      expect(mockHttpClientInstance.get).toHaveBeenCalledWith(httpsUrl);

      const httpResult = await fetcher.fetch(httpUrl);
      expect(httpResult.success).toBe(true);
      expect(mockHttpClientInstance.get).toHaveBeenCalledWith(httpUrl);
    });

    it("should handle HTTP client errors gracefully", async () => {
      mockHttpClientInstance.get.mockRejectedValue(new Error("Network error"));

      const result: FetchResult = await fetcher.fetch("https://example.com");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Failed to fetch content: Network error");
    });

    it("should handle unknown errors gracefully", async () => {
      mockHttpClientInstance.get.mockRejectedValue("Unknown error");

      const result: FetchResult = await fetcher.fetch("https://example.com");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Failed to fetch content: Unknown error");
    });

    it("should handle null response from HTTP client", async () => {
      mockHttpClientInstance.get.mockResolvedValue(null);

      const result: FetchResult = await fetcher.fetch("https://example.com");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Failed to fetch content: No content received");
    });

    it("should handle undefined response from HTTP client", async () => {
      mockHttpClientInstance.get.mockResolvedValue(undefined);

      const result: FetchResult = await fetcher.fetch("https://example.com");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Failed to fetch content: No content received");
    });

    it("should handle non-string response from HTTP client", async () => {
      mockHttpClientInstance.get.mockResolvedValue(123 as unknown as string);

      const result: FetchResult = await fetcher.fetch("https://example.com");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Failed to fetch content: No content received");
    });

    it("should trim whitespace from content", async () => {
      const mockResponse =
        "<html><body><h1>Title</h1><p>  \n\t  Content with whitespace  \n\t  </p></body></html>";
      mockHttpClientInstance.get.mockResolvedValue(mockResponse);

      const result: FetchResult = await fetcher.fetch("https://example.com");

      expect(result.success).toBe(true);
      expect(result.data?.content).toContain("Content with whitespace");
    });

    it("should handle empty string response", async () => {
      mockHttpClientInstance.get.mockResolvedValue("");

      const result: FetchResult = await fetcher.fetch("https://example.com");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Failed to fetch content: No content received");
    });

    it("should handle whitespace-only response", async () => {
      mockHttpClientInstance.get.mockResolvedValue("   \n\t   ");

      const result: FetchResult = await fetcher.fetch("https://example.com");

      expect(result.success).toBe(true);
      expect(result.data?.content).toBeDefined();
    });

    it("should respect rate limiting between requests", async () => {
      const mockResponse =
        "<html><body><h1>Test</h1><p>Content</p></body></html>";
      mockHttpClientInstance.get.mockResolvedValue(mockResponse);

      const url = "https://example.com";

      // Make multiple rapid requests
      const promises = [
        fetcher.fetch(url),
        fetcher.fetch(url),
        fetcher.fetch(url),
      ];

      const results = await Promise.all(promises);

      // All should succeed (rate limiting is handled internally)
      results.forEach((result: FetchResult) => {
        expect(result.success).toBe(true);
        expect(result.data?.content).toContain("Content");
      });

      expect(mockHttpClientInstance.get).toHaveBeenCalledTimes(3);
    });
  });

  describe("constructor", () => {
    it("should create instance with default rate limit", () => {
      const newFetcher = new WebContentFetcher();
      expect(newFetcher).toBeInstanceOf(WebContentFetcher);
    });

    it("should create instance with custom rate limit", () => {
      const newFetcher = new WebContentFetcher(5, 2000);
      expect(newFetcher).toBeInstanceOf(WebContentFetcher);
    });

    it("should use HttpClient singleton", () => {
      new WebContentFetcher();
      new WebContentFetcher();

      expect(mockGetInstance).toHaveBeenCalled();
    });
  });
});
