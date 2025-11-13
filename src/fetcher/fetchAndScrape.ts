import * as cheerio from "cheerio";
import TurndownService from "turndown";
import { ScraperOptions, WebContent } from "../types";

/**
 * Scrapes a web page and extracts content optimized for LLM consumption
 * @param html - The HTML content to parse
 * @param url - The URL of the page (optional, for metadata)
 * @param options - Configuration options
 * @returns Extracted content as clean text
 */
export async function scrapeWebPage(
  html: string,
  url?: string,
  options: ScraperOptions = {},
): Promise<WebContent> {
  const {
    includeMetadata = true,
    includeLinks = true,
    cleanWhitespace = true,
    selectors = {},
  } = options;

  const $ = cheerio.load(html);
  const turndown = new TurndownService({
    headingStyle: "atx",
    codeBlockStyle: "fenced",
  });

  // Remove unwanted elements
  const defaultRemove = [
    "script",
    "style",
    "noscript",
    "iframe",
    "svg",
    "nav",
    "footer",
    'header[role="banner"]',
    '[role="navigation"]',
    '[role="complementary"]',
    ".advertisement",
    ".ad",
    ".sidebar",
    ".cookie-banner",
    "#cookie-notice",
  ];

  const elementsToRemove = [...defaultRemove, ...(selectors.remove || [])];
  elementsToRemove.forEach((selector) => {
    $(selector).remove();
  });

  // Extract metadata
  let metadata: WebContent["metadata"];
  if (includeMetadata) {
    metadata = {
      title:
        $("title").text() || $('meta[property="og:title"]').attr("content"),
      description:
        $('meta[name="description"]').attr("content") ||
        $('meta[property="og:description"]').attr("content"),
      url: url || $('meta[property="og:url"]').attr("content"),
      author:
        $('meta[name="author"]').attr("content") ||
        $('meta[property="article:author"]').attr("content"),
      publishDate:
        $('meta[property="article:published_time"]').attr("content") ||
        $("time[datetime]").attr("datetime"),
    };
  }

  // Focus on main content if selector provided
  let $content = selectors.focus ? $(selectors.focus) : $("body");

  // If no focus selector, try to find main content automatically
  if (!selectors.focus) {
    const mainSelectors = [
      "main",
      "article",
      '[role="main"]',
      "#content",
      ".content",
    ];
    for (const sel of mainSelectors) {
      const $main = $(sel);
      if ($main.length > 0) {
        $content = $main;
        break;
      }
    }
  }

  // Handle links
  if (!includeLinks) {
    $content.find("a").each((_, el) => {
      const $el = $(el);
      $el.replaceWith($el.text());
    });
  }

  // Convert HTML to Markdown for better structure
  let markdown = turndown.turndown($content.html() || "");

  // Clean up whitespace
  if (cleanWhitespace) {
    markdown = markdown
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .join("\n\n")
      .replace(/\n{3,}/g, "\n\n");
  }

  // Build final text output
  let finalText = "";

  if (includeMetadata && metadata) {
    if (metadata.title) {
      finalText += `# ${metadata.title}\n\n`;
    }
    if (metadata.url) {
      finalText += `Source: ${metadata.url}\n\n`;
    }
    if (metadata.author) {
      finalText += `Author: ${metadata.author}\n\n`;
    }
    if (metadata.publishDate) {
      finalText += `Published: ${metadata.publishDate}\n\n`;
    }
    if (metadata.description) {
      finalText += `${metadata.description}\n\n---\n\n`;
    }
  }

  finalText += markdown;

  return {
    content: finalText,
    metadata,
  };
}

/**
 * Fetches and scrapes a web page from a URL
 * @param url - The URL to fetch and scrape
 * @param options - Configuration options
 * @returns Extracted content as clean text
 */
export async function fetchAndScrape(
  url: string,
  options: ScraperOptions = {},
): Promise<WebContent> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Failed to fetch ${url}: ${response.status} ${response.statusText}`,
    );
  }

  const html = await response.text();
  return scrapeWebPage(html, url, options);
}

export default { fetchAndScrape, scrapeWebPage };
