import { FetchResult, WebContent } from "../types";
import { scrapeWebPage } from "./fetchAndScrape";
import { HttpClient, RateLimiter } from "../utils";

/**
 * Web content fetcher with built-in rate limiting
 * Fetches and processes content from web URLs
 */
export class WebContentFetcher {
  private rateLimiter: RateLimiter;
  private httpClient: HttpClient;

  /**
   * Create a new WebContentFetcher instance
   * @param rateLimit - Number of requests allowed per interval (default: 1)
   * @param rateLimitInterval - Time interval in milliseconds (default: 1000ms)
   */
  constructor(rateLimit: number = 1, rateLimitInterval: number = 1000) {
    this.rateLimiter = new RateLimiter(rateLimit, rateLimitInterval);
    this.httpClient = HttpClient.getInstance();
  }

  /**
   * Fetch content from a URL with rate limiting
   * @param url - The URL to fetch content from
   * @returns Promise resolving to FetchResult object
   */
  public async fetch(url: string): Promise<FetchResult> {
    if (!url || url.trim().length === 0) {
      return {
        success: false,
        error: "URL cannot be empty",
      };
    }

    // Basic URL validation
    try {
      new URL(url);
    } catch {
      return {
        success: false,
        error: "Invalid URL format",
      };
    }

    await this.rateLimiter.acquire();

    try {
      const response = await this.httpClient.get<string>(url);
      const content = await this.parseContent(response);
      return {
        success: true,
        data: content,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      return {
        success: false,
        error: `Failed to fetch content: ${errorMessage}`,
      };
    }
  }

  /**
   * Parse and format the fetched content
   * @param data - Raw content data
   * @returns Formatted FetchResult object
   */
  private async parseContent(data: string): Promise<WebContent> {
    if (!data || typeof data !== "string") {
      throw new Error("No content received");
    }

    return await scrapeWebPage(data, "", {
      cleanWhitespace: true,
      includeMetadata: true,
      includeLinks: true,
      selectors: {
        remove: [],
        focus: "",
      },
    });
  }
}
