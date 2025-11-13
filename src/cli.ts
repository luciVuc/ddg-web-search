#!/usr/bin/env node

import { FetchResult, SearchResult, WebContentFetcher, WebSearcher } from ".";
import * as readline from "readline";

// ANSI color codes for better terminal output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
} as const;

/**
 * Command Line Interface for DDG Web Search Package
 * Provides interactive and non-interactive search and content fetching
 */
export class CLI {
  private searcher: WebSearcher;
  private fetcher: WebContentFetcher;

  constructor() {
    this.searcher = new WebSearcher();
    this.fetcher = new WebContentFetcher();
  }

  private log(message: string, color?: string): void {
    const colorCode = color ? colors[color as keyof typeof colors] : "";
    console.log(`${colorCode}${message}${colors.reset}`);
  }

  private logError(message: string): void {
    this.log(`❌ Error: ${message}`, "red");
  }

  private logSuccess(message: string): void {
    this.log(`✅ ${message}`, "green");
  }

  private logInfo(message: string): void {
    this.log(`ℹ️  ${message}`, "cyan");
  }

  private logWarning(message: string): void {
    this.log(`⚠️  ${message}`, "yellow");
  }

  private displayBanner(): void {
    this.log("", "cyan");
    this.log("🦆 DDG Web Search CLI", "cyan");
    this.log("=".repeat(50), "cyan");
    this.log("Interactive search and web content fetching tool", "white");
    this.log("");
  }

  private displayHelp(): void {
    this.log("\n📖 Available Commands:", "bright");
    this.log("");
    this.log(
      "  search <query>      - Search the web for the given query",
      "white",
    );
    this.log(
      "  fetch <url>         - Fetch content from a specific URL",
      "white",
    );
    this.log("  interactive         - Start interactive mode", "white");
    this.log("  help                - Show this help message", "white");
    this.log("  version             - Show version information", "white");
    this.log("");
    this.log("📝 Examples:", "bright");
    this.log('  ddg-web-search search "TypeScript tutorials"', "yellow");
    this.log("  ddg-web-search fetch https://example.com", "yellow");
    this.log("  ddg-web-search interactive", "yellow");
    this.log("");
  }

  private async displayVersion(): Promise<void> {
    // Use require for JSON since we can't easily import it in this context
    const packageInfo = (await import("../package.json")) as {
      name: string;
      version: string;
      description: string;
    };
    this.log(`\n📦 Package: ${packageInfo.name}`, "cyan");
    this.log(`🔢 Version: ${packageInfo.version}`, "cyan");
    this.log(`📝 Description: ${packageInfo.description}`, "white");
    this.log("");
  }

  private displaySearchResults(results: SearchResult[]): void {
    if (results.length === 0) {
      this.logWarning("No search results found.");
      return;
    }

    this.logSuccess(`Found ${results.length} search results:`);
    this.log("");

    /* istanbul ignore next */
    results.forEach((result, index) => {
      this.log(`${index + 1}. ${result.title}`, "bright");
      this.log(`   🔗 ${result.url}`, "blue");
      if (result.snippet) {
        this.log(`   📄 ${result.snippet}`, "white");
      }
      if (result.icon) {
        this.log(`   🎯 ${result.icon}`, "white");
      }
      this.log("");
    });
  }

  private displayFetchResult(result: FetchResult, url: string): void {
    if (result.success) {
      this.logSuccess("Content fetched successfully!");
      this.log(`📄 URL: ${url}`, "blue");
      this.log(
        `📊 Content Length: ${result.data?.content?.length || 0} characters`,
        "cyan",
      );

      if (result.data?.content) {
        this.log("\n📝 Content Preview (first 500 characters):", "bright");
        this.log("─".repeat(50), "white");
        const preview = result.data?.content.substring(0, 500);
        this.log(
          preview + (result.data?.content.length > 500 ? "..." : ""),
          "white",
        );
        this.log("─".repeat(50), "white");
      }
    } else {
      this.logError(
        `Failed to fetch content: ${result.error || "Unknown error"}`,
      );
    }
  }

  async search(query: string): Promise<void> {
    if (!query.trim()) {
      this.logError("Search query cannot be empty");
      return;
    }

    this.logInfo(`Searching for: "${query}"`);
    this.log("🔍 Searching...", "yellow");

    try {
      const results = await this.searcher.search(query);
      this.displaySearchResults(results);
    } catch (error) {
      /* istanbul ignore next */
      this.logError(`Search failed: ${error}`);
    }
  }

  async fetch(url: string): Promise<void> {
    if (!url.trim()) {
      this.logError("URL cannot be empty");
      return;
    }

    // Basic URL validation
    try {
      new URL(url);
    } catch {
      this.logError("Invalid URL format");
      return;
    }

    this.logInfo(`Fetching content from: ${url}`);
    this.log("📥 Fetching...", "yellow");

    try {
      const result = await this.fetcher.fetch(url);
      this.displayFetchResult(result, url);
    } catch (error) {
      /* istanbul ignore next */
      this.logError(`Fetch failed: ${error}`);
    }
  }

  /* istanbul ignore next */
  async interactive(): Promise<void> {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    this.log("\n🎯 Interactive Mode Started", "green");
    this.log('Type "help" for commands, "exit" to quit', "white");
    this.log("");

    const prompt = () => {
      rl.question("🦆 ddg> ", async (input: string) => {
        const trimmed = input.trim();

        if (!trimmed) {
          prompt();
          return;
        }

        const [command, ...args] = trimmed.split(" ");
        const argument = args.join(" ");

        if (!command) {
          this.logError("Invalid command");
          prompt();
          return;
        }

        switch (command.toLowerCase()) {
          case "search":
          case "s":
            if (argument) {
              await this.search(argument);
            } else {
              this.logError("Usage: search <query>");
            }
            break;

          case "fetch":
          case "f":
            if (argument) {
              await this.fetch(argument);
            } else {
              this.logError("Usage: fetch <url>");
            }
            break;

          case "help":
          case "h":
            this.displayHelp();
            break;

          case "version":
          case "v":
            await this.displayVersion();
            break;

          case "clear":
          case "cls":
            console.clear();
            this.displayBanner();
            break;

          case "exit":
          case "quit":
          case "q":
            this.log("👋 Goodbye!", "cyan");
            rl.close();
            return;

          default:
            this.logError(`Unknown command: ${command}`);
            this.log('Type "help" for available commands', "white");
            break;
        }

        this.log("");
        prompt();
      });
    };

    prompt();
  }

  async run(args: string[]): Promise<void> {
    this.displayBanner();

    if (args.length === 0) {
      this.displayHelp();
      return;
    }

    const [command, ...params] = args;
    const argument = params.join(" ");

    /* istanbul ignore next */
    if (!command) {
      this.logError("No command provided");
      this.displayHelp();
      return;
    }

    switch (command.toLowerCase()) {
      case "search":
      case "s":
        if (argument) {
          await this.search(argument);
        } else {
          this.logError("Usage: ddg-web-search search <query>");
          this.log(
            'Example: ddg-web-search search "TypeScript tutorials"',
            "yellow",
          );
        }
        break;

      case "fetch":
      case "f":
        if (argument) {
          await this.fetch(argument);
        } else {
          this.logError("Usage: ddg-web-search fetch <url>");
          this.log(
            "Example: ddg-web-search fetch https://example.com",
            "yellow",
          );
        }
        break;

      case "interactive":
      case "i":
        await this.interactive();
        break;

      case "help":
      case "h":
      case "--help":
      case "-h":
        this.displayHelp();
        break;

      case "version":
      case "v":
      case "--version":
      case "-v":
        await this.displayVersion();
        break;

      default:
        this.logError(`Unknown command: ${command}`);
        this.displayHelp();
        break;
    }
  }
}

// Main execution
/* istanbul ignore next */
if (require.main === module) {
  const cli = new CLI();
  const args = process.argv.slice(2);

  cli.run(args).catch((error) => {
    console.error("❌ Fatal error:", error);
    process.exit(1);
  });
}
