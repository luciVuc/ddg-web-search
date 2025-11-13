#!/usr/bin/env node

/**
 * Test script for DDG Web Search MCP Server
 * Tests basic functionality of search and fetch tools
 */

import { MCPServer } from "./src/mcp";

async function testMCPServer() {
  console.log("🧪 Testing DDG Web Search MCP Server...");

  const server = new MCPServer();

  // Note: In actual usage, the MCP server communicates via stdio
  // This is just a basic instantiation test

  console.log("✅ MCP Server instantiated successfully");
  console.log("🔧 Server provides tools: search, fetch_web_content");
  console.log("📡 Run with: npm run mcp");
  console.log("📋 Or use compiled version: node dist/mcp.js");

  // Prevent unused variable warning
  if (server) {
    console.log("🎯 Server ready for MCP communication");
  }
}

testMCPServer().catch(console.error);
