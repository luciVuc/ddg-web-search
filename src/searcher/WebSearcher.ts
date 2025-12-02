import puppeteer, { Browser, Page } from "puppeteer";
import { RateLimiter } from "../utils";
import { SearchResult } from "../types";

// Constants
const RATE_LIMIT_REQUESTS = 1;
const RATE_LIMIT_INTERVAL_MS = 2000;
const NAVIGATION_TIMEOUT_MS = 30000;
const SELECTOR_WAIT_TIMEOUT_MS = 5000;
const CAPTCHA_MANUAL_SOLVE_TIMEOUT_MS = 60000;

/**
 * Web Search interface using Puppeteer for browser automation
 * Includes built-in rate limiting and captcha handling capabilities
 */
export class WebSearcher {
  private rateLimiter: RateLimiter;
  private baseUrl: string;
  private browser: Browser | null = null;
  private headless: boolean;
  private browserInitPromise: Promise<void> | null = null;

  constructor(headless: boolean = true) {
    this.rateLimiter = new RateLimiter(
      RATE_LIMIT_REQUESTS,
      RATE_LIMIT_INTERVAL_MS,
    );
    this.baseUrl = "https://html.duckduckgo.com";
    this.headless = headless;
  }

  /**
   * Initialize browser instance if not already created
   * Uses a promise-based mutex to prevent race conditions
   */
  private async initBrowser(): Promise<void> {
    // If browser is already initialized, return
    if (this.browser) {
      return;
    }

    // If initialization is in progress, wait for it
    if (this.browserInitPromise) {
      await this.browserInitPromise;
      return;
    }

    // Start initialization
    this.browserInitPromise = (async () => {
      try {
        this.browser = await puppeteer.launch({
          headless: this.headless,
          args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-blink-features=AutomationControlled",
            "--disable-features=VizDisplayCompositor",
          ],
        });
      } finally {
        this.browserInitPromise = null;
      }
    })();

    await this.browserInitPromise;
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
        timeout: NAVIGATION_TIMEOUT_MS,
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
        // Wait for captcha to be solved manually (not headless mode)
        console.warn(
          `Waiting up to ${CAPTCHA_MANUAL_SOLVE_TIMEOUT_MS / 1000}s for manual captcha solving...`,
        );
        try {
          await page.waitForSelector(
            '.captcha, [id*="captcha"], [class*="captcha"]',
            { hidden: true, timeout: CAPTCHA_MANUAL_SOLVE_TIMEOUT_MS },
          );
          console.log("Captcha solved, continuing...");
        } catch (error) {
          console.warn("Captcha wait timeout - proceeding anyway");
        }
      }

      // Find and fill the search box
      const searchBoxSelector =
        'input[name="q"], #search_form_input, .search__input';
      await page.waitForSelector(searchBoxSelector, {
        timeout: SELECTOR_WAIT_TIMEOUT_MS,
      });
      await page.type(searchBoxSelector, query);

      // Submit the search
      const submitButton =
        'button[type="submit"], .search__button, input[type="submit"]';
      await page.click(submitButton);

      // Wait for search results page to load
      await page.waitForNavigation({
        waitUntil: "networkidle0",
        timeout: NAVIGATION_TIMEOUT_MS,
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
          await page.waitForSelector(selector, {
            timeout: SELECTOR_WAIT_TIMEOUT_MS,
          });
          console.log(`Successfully found results using selector: ${selector}`);
          resultsFound = true;
          break;
        } catch (error) {
          // Log each failed attempt for debugging
          console.debug(`Selector '${selector}' not found, trying next...`);
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
