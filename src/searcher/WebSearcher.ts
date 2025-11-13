import puppeteer, { Browser, Page } from "puppeteer";
import { RateLimiter } from "../utils";
import { SearchResult } from "../types";

/**
 * Web Search interface using Puppeteer for browser automation
 * Includes built-in rate limiting and captcha handling capabilities
 */
export class WebSearcher {
  private rateLimiter: RateLimiter;
  private baseUrl: string;
  private browser: Browser | null = null;
  private headless: boolean;

  constructor(headless: boolean = true) {
    this.rateLimiter = new RateLimiter(1, 2000); // 1 request per 2 seconds to be more conservative
    this.baseUrl = "https://html.duckduckgo.com";
    this.headless = headless;
  }

  /**
   * Initialize browser instance if not already created
   */
  private async initBrowser(): Promise<void> {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: this.headless,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-blink-features=AutomationControlled",
          "--disable-features=VizDisplayCompositor",
        ],
      });
    }
  }

  /**
   * Close browser instance and cleanup resources
   */
  public async close(): Promise<void> {
    if (this.browser) {
      try {
        await this.browser.close();
      } catch (error) {
        // Log error but don't throw - cleanup should be non-throwing
        console.error("Error closing browser:", error);
      }
      this.browser = null;
    }
  }

  /**
   * Search the web for the given query using Puppeteer
   * @param query - The search query string
   * @returns Promise resolving to array of search results
   */
  public async search(query: string): Promise<SearchResult[]> {
    if (!query || query.trim().length === 0) {
      return [];
    }

    await this.rateLimiter.acquire();

    let page: Page | null = null;
    try {
      await this.initBrowser();

      if (!this.browser) {
        throw new Error("Failed to initialize browser");
      }

      page = await this.browser.newPage();

      // Set user agent to avoid detection
      await page.setUserAgent(
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
      );

      // Set viewport
      await page.setViewport({ width: 1366, height: 768 });

      // Navigate to DuckDuckGo and perform search
      await page.goto("https://duckduckgo.com", {
        waitUntil: "networkidle0",
        timeout: 30000,
      });

      // Check if there's a captcha challenge on the main page
      const captchaElement = await page.$(
        '.captcha, [id*="captcha"], [class*="captcha"]',
      );
      if (captchaElement) {
        console.warn("Captcha detected. You may need to solve it manually.");
        // In headless mode, we can't solve captcha, so return empty results
        if (this.headless) {
          return [];
        }
        // Wait a bit for manual solving if not headless
        await page.waitForFunction(() => true, { timeout: 10000 });
      }

      // Find and fill the search box
      const searchBoxSelector =
        'input[name="q"], #search_form_input, .search__input';
      await page.waitForSelector(searchBoxSelector, { timeout: 5000 });
      await page.type(searchBoxSelector, query);

      // Submit the search
      const submitButton =
        'button[type="submit"], .search__button, input[type="submit"]';
      await page.click(submitButton);

      // Wait for search results page to load
      await page.waitForNavigation({
        waitUntil: "networkidle0",
        timeout: 30000,
      });

      // Wait for search results to load - try multiple selectors
      const possibleSelectors = [
        ".result",
        ".web-result",
        "[data-result]",
        ".result__body",
        ".results_links",
        ".result-link",
        ".results .result",
      ];

      let resultsFound = false;
      for (const selector of possibleSelectors) {
        try {
          await page.waitForSelector(selector, { timeout: 5000 });
          resultsFound = true;
          break;
        } catch (error) {
          // Try next selector
          continue;
        }
      }

      if (!resultsFound) {
        console.warn(
          "No search result selectors found, attempting to extract from page anyway...",
        );
      }

      // Extract search results
      /* istanbul ignore next */
      const results = await page.evaluate(() => {
        const searchResults: SearchResult[] = [];

        // Try different selectors for DuckDuckGo results
        const resultSelectors = [
          ".result",
          ".web-result",
          "[data-result]",
          ".result__body",
          ".results_links",
          ".result-link",
          ".results .result",
          // More generic selectors
          "article",
          '[data-testid*="result"]',
          ".snippet",
        ];

        let resultsFound = false;

        for (const selector of resultSelectors) {
          const resultElements = document.querySelectorAll(selector);

          if (resultElements.length > 0) {
            console.log(
              `Found ${resultElements.length} elements with selector: ${selector}`,
            );
            resultsFound = true;

            resultElements.forEach((element) => {
              // Try different selectors for title and link
              const titleSelectors = [
                ".result__title a",
                ".result__a",
                "h2 a",
                "h3 a",
                ".result-title a",
                'a[data-testid="result-title-a"]',
                "a[href]",
                ".titlelink",
                ".result-header a",
              ];

              const snippetSelectors = [
                ".result__snippet",
                ".result-snippet",
                ".snippet",
                ".description",
                '[data-result="snippet"]',
                ".result__body",
                ".summary",
              ];

              let titleElement: HTMLAnchorElement | null = null;
              let snippetElement: HTMLElement | null = null;

              // Find title element
              for (const titleSelector of titleSelectors) {
                titleElement = element.querySelector(
                  titleSelector,
                ) as HTMLAnchorElement;
                if (titleElement && titleElement.textContent?.trim()) break;
              }

              // Find snippet element
              for (const snippetSelector of snippetSelectors) {
                snippetElement = element.querySelector(
                  snippetSelector,
                ) as HTMLElement;
                if (snippetElement && snippetElement.textContent?.trim()) break;
              }

              if (titleElement) {
                const title = titleElement.textContent?.trim() || "";
                let url =
                  titleElement.href || titleElement.getAttribute("href") || "";
                const snippet = snippetElement?.textContent?.trim() || "";

                // Handle relative URLs
                if (url.startsWith("//")) {
                  url = "https:" + url;
                } else if (url.startsWith("/")) {
                  url = "https://duckduckgo.com" + url;
                } else if (url.startsWith("http://")) {
                  url = url.replace("http://", "https://");
                }

                // Filter out internal DuckDuckGo URLs and ensure we have valid content
                if (
                  title &&
                  url &&
                  !url.includes("duckduckgo.com/y.js") &&
                  !url.includes("duckduckgo.com/l/?uddg=") &&
                  !url.includes("javascript:") &&
                  url.startsWith("http")
                ) {
                  searchResults.push({
                    title,
                    url,
                    snippet,
                    icon: "",
                  });
                }
              }
            });

            if (resultsFound && searchResults.length > 0) break;
          }
        }

        console.log(`Total valid results extracted: ${searchResults.length}`);
        return searchResults;
      });

      return results;
    } catch (error) {
      this.handleError(error);
      return [];
    } finally {
      if (page) {
        try {
          await page.close();
        } catch (error) {
          // Log error but don't let it affect the search result
          console.error("Error closing page:", error);
        }
      }
    }
  }

  /**
   * Handle and log errors from browser operations
   * @param error - The error object to handle
   */
  private handleError(error: unknown): void {
    if (error instanceof Error) {
      console.error("Error during web search:", error.message);

      // Handle specific Puppeteer errors
      if (error.message.includes("Navigation timeout")) {
        console.error("Search timed out - the page took too long to load");
      } else if (error.message.includes("Target closed")) {
        console.error("Browser was closed unexpectedly");
      } else if (error.message.includes("Protocol error")) {
        console.error("Browser connection error occurred");
      }
    } else {
      console.error("Unknown error occurred during search:", error);
    }
  }
}
