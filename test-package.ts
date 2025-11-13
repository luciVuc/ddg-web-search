import { WebSearcher, WebContentFetcher } from "./src/index";

async function testPackage() {
  console.log("🚀 Testing DDG Web Search Package...\n");

  // Test WebSearcher
  console.log("1. Testing WebSearcher...");
  const searcher = new WebSearcher();
  try {
    const results = await searcher.search("JavaScript");
    console.log(`   ✅ Search completed. Results count: ${results.length}`);
    if (results.length > 0 && results[0]) {
      console.log(`   📄 First result: ${results[0].title}`);
      console.log(`   🔗 URL: ${results[0].url}`);
    }
  } catch (error) {
    console.log(`   ❌ Search failed: ${error}`);
  }

  console.log();

  // Test WebContentFetcher
  console.log("2. Testing WebContentFetcher...");
  const fetcher = new WebContentFetcher();
  try {
    const result = await fetcher.fetch("https://httpbin.org/html");
    console.log(`   ✅ Fetch completed. Success: ${result.success}`);
    console.log(
      `   📝 Content length: ${result.data?.content?.length || 0} characters`,
    );
  } catch (error) {
    console.log(`   ❌ Fetch failed: ${error}`);
  }

  console.log();

  // Test rate limiting
  console.log("3. Testing rate limiting...");
  const start = Date.now();
  try {
    await fetcher.fetch("https://httpbin.org/html");
    await fetcher.fetch("https://httpbin.org/html");
    const elapsed = Date.now() - start;
    console.log(`   ✅ Rate limiting working. Two requests took ${elapsed}ms`);
    console.log(
      `   ${elapsed >= 1000 ? "✅" : "⚠️"} Rate limit enforced: ${elapsed >= 1000}`,
    );
  } catch (error) {
    console.log(`   ❌ Rate limiting test failed: ${error}`);
  }

  console.log("\n🎉 Package testing completed!");
}

testPackage().catch(console.error);
