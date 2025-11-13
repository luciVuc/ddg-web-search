export const CallToolRequestSchema = {
  type: "call_tool",
};

export const ListToolsRequestSchema = {
  type: "list_tools",
};

export class Tool {
  constructor(name, description, inputSchema) {
    this.name = name;
    this.description = description;
    this.inputSchema = inputSchema;
  }
}

export class CallToolRequest {
  constructor(params) {
    this.params = params;
  }
}
