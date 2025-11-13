// Jest setup file to configure module mocking for ESM modules

// Mock @modelcontextprotocol/sdk modules before they are imported
jest.mock("@modelcontextprotocol/sdk/server/index.js", () => ({
  Server: jest.fn().mockImplementation(() => ({
    setRequestHandler: jest.fn(),
    connect: jest.fn().mockResolvedValue(undefined),
    close: jest.fn().mockResolvedValue(undefined),
  })),
}));

jest.mock("@modelcontextprotocol/sdk/server/stdio.js", () => ({
  StdioServerTransport: jest.fn().mockImplementation(() => ({
    start: jest.fn().mockResolvedValue(undefined),
    close: jest.fn().mockResolvedValue(undefined),
  })),
}));

jest.mock("@modelcontextprotocol/sdk/server/sse.js", () => ({
  SSEServerTransport: jest.fn().mockImplementation(() => ({
    start: jest.fn().mockResolvedValue(undefined),
    close: jest.fn().mockResolvedValue(undefined),
  })),
}));

jest.mock("@modelcontextprotocol/sdk/types.js", () => ({
  CallToolRequestSchema: {},
  ListToolsRequestSchema: {},
  ErrorCode: {
    InvalidRequest: -32600,
    MethodNotFound: -32601,
    InvalidParams: -32602,
    InternalError: -32603,
  },
  McpError: jest.fn().mockImplementation((code, message) => ({
    code,
    message,
  })),
}));

// Mock node:http for HTTP server functionality
jest.mock("node:http", () => ({
  createServer: jest.fn().mockImplementation(() => ({
    listen: jest.fn().mockImplementation((port, callback) => {
      if (callback) callback();
    }),
    close: jest.fn().mockImplementation((callback) => {
      if (callback) callback();
    }),
    on: jest.fn(),
  })),
}));
