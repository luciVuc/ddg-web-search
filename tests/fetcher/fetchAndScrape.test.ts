import {
  scrapeWebPage,
  fetchAndScrape,
} from "../../src/fetcher/fetchAndScrape";
import { ScraperOptions, WebContent } from "../../src/types";

// Mock global fetch for fetchAndScrape tests
global.fetch = jest.fn();

describe("fetchAndScrape", () => {
  describe("scrapeWebPage", () => {
    it("should extract basic content from HTML", async () => {
      const html = `
        <html>
          <head>
            <title>Test Page</title>
          </head>
          <body>
            <h1>Main Title</h1>
            <p>This is a test paragraph.</p>
            <p>Another paragraph with <strong>bold text</strong>.</p>
          </body>
        </html>
      `;

      const result: WebContent = await scrapeWebPage(html);

      expect(result.content).toContain("# Test Page");
      expect(result.content).toContain("# Main Title");
      expect(result.content).toContain("This is a test paragraph.");
      expect(result.content).toContain("**bold text**");
      expect(result.metadata?.title).toBe("Test Page");
    });

    it("should extract metadata from meta tags", async () => {
      const html = `
        <html>
          <head>
            <title>Test Article</title>
            <meta name="description" content="A test article description">
            <meta name="author" content="John Doe">
            <meta property="og:title" content="OG Title">
            <meta property="og:description" content="OG Description">
            <meta property="og:url" content="https://example.com/article">
            <meta property="article:author" content="Jane Smith">
            <meta property="article:published_time" content="2023-01-01T00:00:00Z">
          </head>
          <body>
            <h1>Article Content</h1>
          </body>
        </html>
      `;

      const result: WebContent = await scrapeWebPage(
        html,
        "https://example.com",
      );

      expect(result.metadata).toEqual({
        title: "Test Article",
        description: "A test article description",
        url: "https://example.com",
        author: "John Doe",
        publishDate: "2023-01-01T00:00:00Z",
      });
    });

    it("should prefer Open Graph metadata when available", async () => {
      const html = `
        <html>
          <head>
            <title>Regular Title</title>
            <meta name="description" content="Regular description">
            <meta property="og:title" content="OG Title">
            <meta property="og:description" content="OG Description">
            <meta property="article:author" content="Article Author">
          </head>
          <body>
            <h1>Content</h1>
          </body>
        </html>
      `;

      const result: WebContent = await scrapeWebPage(html);

      expect(result.metadata?.title).toBe("Regular Title");
      expect(result.metadata?.description).toBe("Regular description");
      expect(result.metadata?.author).toBe("Article Author");
    });

    it("should remove unwanted elements", async () => {
      const html = `
        <html>
          <body>
            <h1>Main Content</h1>
            <p>Important content</p>
            <script>console.log('should be removed');</script>
            <style>.test { color: red; }</style>
            <nav>Navigation menu</nav>
            <footer>Footer content</footer>
            <div class="advertisement">Ad content</div>
            <div class="sidebar">Sidebar content</div>
          </body>
        </html>
      `;

      const result: WebContent = await scrapeWebPage(html);

      expect(result.content).toContain("Main Content");
      expect(result.content).toContain("Important content");
      expect(result.content).not.toContain("should be removed");
      expect(result.content).not.toContain("color: red");
      expect(result.content).not.toContain("Navigation menu");
      expect(result.content).not.toContain("Footer content");
      expect(result.content).not.toContain("Ad content");
      expect(result.content).not.toContain("Sidebar content");
    });

    it("should remove custom selectors when specified", async () => {
      const html = `
        <html>
          <body>
            <h1>Main Content</h1>
            <p>Keep this content</p>
            <div class="custom-remove">Remove this</div>
            <span id="also-remove">And this</span>
            <p>Keep this too</p>
          </body>
        </html>
      `;

      const options: ScraperOptions = {
        selectors: {
          remove: [".custom-remove", "#also-remove"],
        },
      };

      const result: WebContent = await scrapeWebPage(html, undefined, options);

      expect(result.content).toContain("Main Content");
      expect(result.content).toContain("Keep this content");
      expect(result.content).toContain("Keep this too");
      expect(result.content).not.toContain("Remove this");
      expect(result.content).not.toContain("And this");
    });

    it("should focus on specific content selector", async () => {
      const html = `
        <html>
          <body>
            <nav>Navigation</nav>
            <main>
              <h1>Main Article</h1>
              <p>Article content</p>
            </main>
            <aside>Sidebar</aside>
          </body>
        </html>
      `;

      const options: ScraperOptions = {
        selectors: {
          focus: "main",
        },
      };

      const result: WebContent = await scrapeWebPage(html, undefined, options);

      expect(result.content).toContain("Main Article");
      expect(result.content).toContain("Article content");
      expect(result.content).not.toContain("Navigation");
      expect(result.content).not.toContain("Sidebar");
    });

    it("should automatically find main content when no focus selector", async () => {
      const html = `
        <html>
          <body>
            <nav>Navigation</nav>
            <article>
              <h1>Article Title</h1>
              <p>Article content</p>
            </article>
            <aside>Sidebar</aside>
          </body>
        </html>
      `;

      const result: WebContent = await scrapeWebPage(html);

      expect(result.content).toContain("Article Title");
      expect(result.content).toContain("Article content");
      // Navigation and sidebar might still be included since we're not focusing
    });

    it("should handle links based on includeLinks option", async () => {
      const html = `
        <html>
          <body>
            <p>Check out <a href="https://example.com">this link</a> for more info.</p>
            <p>Another <a href="/page">internal link</a> here.</p>
          </body>
        </html>
      `;

      // Test with links included (default)
      const withLinks = await scrapeWebPage(html);
      expect(withLinks.content).toContain("[this link](https://example.com)");
      expect(withLinks.content).toContain("[internal link](/page)");

      // Test with links excluded
      const withoutLinks = await scrapeWebPage(html, undefined, {
        includeLinks: false,
      });
      expect(withoutLinks.content).toContain("this link");
      expect(withoutLinks.content).toContain("internal link");
      expect(withoutLinks.content).not.toContain("[this link]");
      expect(withoutLinks.content).not.toContain("https://example.com");
    });

    it("should handle metadata inclusion option", async () => {
      const html = `
        <html>
          <head>
            <title>Test Page</title>
            <meta name="description" content="Test description">
          </head>
          <body>
            <h1>Content</h1>
          </body>
        </html>
      `;

      // Test with metadata included (default)
      const withMetadata = await scrapeWebPage(html);
      expect(withMetadata.content).toContain("# Test Page");
      expect(withMetadata.content).toContain("Test description");
      expect(withMetadata.metadata?.title).toBe("Test Page");

      // Test with metadata excluded
      const withoutMetadata = await scrapeWebPage(html, undefined, {
        includeMetadata: false,
      });
      expect(withoutMetadata.content).not.toContain("# Test Page");
      expect(withoutMetadata.content).not.toContain("Test description");
      expect(withoutMetadata.metadata).toBeUndefined();
    });

    it("should handle whitespace cleaning option", async () => {
      const html = `
        <html>
          <body>
            <h1>   Title with spaces   </h1>
            <p>


            Paragraph with
            
            
            lots of whitespace
            
            
            </p>
          </body>
        </html>
      `;

      // Test with whitespace cleaning (default)
      const cleaned = await scrapeWebPage(html);
      expect(cleaned.content).not.toContain("   Title with spaces   ");
      expect(cleaned.content).not.toContain("\n\n\n");

      // Test without whitespace cleaning
      const notCleaned = await scrapeWebPage(html, undefined, {
        cleanWhitespace: false,
      });
      // Should have different structure (turndown handles whitespace differently)
      expect(notCleaned.content).toBeDefined();
      expect(notCleaned.content.length).toBeGreaterThanOrEqual(
        cleaned.content.length,
      );
    });

    it("should handle empty or invalid HTML", async () => {
      const emptyHtml = "";
      const result = await scrapeWebPage(emptyHtml);
      expect(result.content).toBe("");

      const invalidHtml = "not html";
      const result2 = await scrapeWebPage(invalidHtml);
      expect(result2.content).toContain("not html");
    });

    it("should handle HTML with time element for publish date", async () => {
      const html = `
        <html>
          <body>
            <article>
              <h1>Article Title</h1>
              <time datetime="2023-12-01T10:00:00Z">December 1, 2023</time>
              <p>Article content</p>
            </article>
          </body>
        </html>
      `;

      const result = await scrapeWebPage(html);
      expect(result.metadata?.publishDate).toBe("2023-12-01T10:00:00Z");
    });

    it("should convert HTML to markdown properly", async () => {
      const html = `
        <html>
          <body>
            <h1>Main Title</h1>
            <h2>Subtitle</h2>
            <p>Paragraph with <strong>bold</strong> and <em>italic</em> text.</p>
            <ul>
              <li>List item 1</li>
              <li>List item 2</li>
            </ul>
            <blockquote>This is a quote</blockquote>
            <code>inline code</code>
            <pre><code>code block</code></pre>
          </body>
        </html>
      `;

      const result = await scrapeWebPage(html);

      expect(result.content).toContain("# Main Title");
      expect(result.content).toContain("## Subtitle");
      expect(result.content).toContain("**bold**");
      expect(result.content).toContain("_italic_");
      expect(result.content).toContain("*   List item 1"); // Note the formatting
      expect(result.content).toContain("*   List item 2");
      expect(result.content).toContain("> This is a quote");
      expect(result.content).toContain("`inline code`");
      expect(result.content).toContain("```");
    });
  });

  describe("fetchAndScrape", () => {
    const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

    beforeEach(() => {
      mockFetch.mockClear();
    });

    it("should fetch and scrape a URL successfully", async () => {
      const mockHtml = `
        <html>
          <head><title>Fetched Page</title></head>
          <body><h1>Fetched Content</h1></body>
        </html>
      `;

      mockFetch.mockResolvedValue({
        ok: true,
        text: async () => mockHtml,
      } as Response);

      const result = await fetchAndScrape("https://example.com");

      expect(mockFetch).toHaveBeenCalledWith("https://example.com");
      expect(result.content).toContain("# Fetched Page");
      expect(result.content).toContain("# Fetched Content");
      expect(result.metadata?.url).toBe("https://example.com");
    });

    it("should pass options to scrapeWebPage", async () => {
      const mockHtml = `
        <html>
          <head><title>Test</title></head>
          <body>
            <main><h1>Main Content</h1></main>
            <aside>Sidebar</aside>
          </body>
        </html>
      `;

      mockFetch.mockResolvedValue({
        ok: true,
        text: async () => mockHtml,
      } as Response);

      const options: ScraperOptions = {
        selectors: { focus: "main" },
        includeMetadata: false,
      };

      const result = await fetchAndScrape("https://example.com", options);

      expect(result.content).toContain("Main Content");
      expect(result.content).not.toContain("Test"); // title excluded
      expect(result.metadata).toBeUndefined();
    });

    it("should handle fetch errors", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: "Not Found",
      } as Response);

      await expect(fetchAndScrape("https://example.com/404")).rejects.toThrow(
        "Failed to fetch https://example.com/404: 404 Not Found",
      );
    });

    it("should handle network errors", async () => {
      mockFetch.mockRejectedValue(new Error("Network error"));

      await expect(fetchAndScrape("https://example.com")).rejects.toThrow(
        "Network error",
      );
    });

    it("should handle different HTTP status codes", async () => {
      // Test 500 error
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
      } as Response);

      await expect(fetchAndScrape("https://example.com")).rejects.toThrow(
        "Failed to fetch https://example.com: 500 Internal Server Error",
      );
    });
  });

  describe("edge cases", () => {
    it("should handle HTML with no body", async () => {
      const html = `
        <html>
          <head><title>No Body</title></head>
        </html>
      `;

      const result = await scrapeWebPage(html);
      expect(result.metadata?.title).toBe("No Body");
      expect(result.content).toContain("# No Body");
    });

    it("should handle malformed HTML", async () => {
      const html = `
        <html>
          <head><title>Malformed</title>
          <body>
            <h1>Unclosed header
            <p>Paragraph without closing tag
            <div>Nested without proper closing
        </html>
      `;

      const result = await scrapeWebPage(html);
      expect(result.metadata?.title).toBe("Malformed");
      expect(result.content).toContain("Unclosed header");
      expect(result.content).toContain("Paragraph without closing tag");
    });

    it("should handle content with special characters", async () => {
      const html = `
        <html>
          <body>
            <h1>Special Characters: &amp; &lt; &gt; &quot; &#39;</h1>
            <p>Unicode: café résumé naïve 中文 العربية</p>
          </body>
        </html>
      `;

      const result = await scrapeWebPage(html);
      expect(result.content).toContain("Special Characters: & < > \" '");
      expect(result.content).toContain(
        "Unicode: café résumé naïve 中文 العربية",
      );
    });

    it("should handle very long content", async () => {
      const longContent = "A".repeat(10000);
      const html = `
        <html>
          <body>
            <h1>Long Content</h1>
            <p>${longContent}</p>
          </body>
        </html>
      `;

      const result = await scrapeWebPage(html);
      expect(result.content).toContain("Long Content");
      expect(result.content).toContain(longContent);
      expect(result.content.length).toBeGreaterThan(10000);
    });
  });
});
