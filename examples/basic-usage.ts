import { WebContentFetcher, WebSearcher } from "../src";

async function main() {
  const searcher = new WebSearcher();
  const fetcher = new WebContentFetcher();

  try {
    // Perform a search
    const searchResults = await searcher.search(
      "TypeScript learning resources",
    );
    console.log("Search Results:", searchResults);

    // Fetch content from the first result
    if (searchResults.length > 0) {
      const firstResultUrl = searchResults[0]?.url || "";
      const fetchResult = await fetcher.fetch(firstResultUrl);
      console.log("Fetch Success:", fetchResult.success);
      if (fetchResult.data?.content) {
        console.log("Content Length:", fetchResult.data?.content.length);
        console.log(
          "Content Preview:",
          fetchResult.data?.content.substring(0, 200) + "...",
        );
      }
    } else {
      console.log("No search results found.");
    }
  } catch (error) {
    console.error("An error occurred:", error);
  }
}

main();
