// MCP Server instance and configuration

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { toolDefinitions } from '../tools/definitions.js';
import { handleToolCall } from '../handlers/index.js';

export function createMCPServer() {
    const server = new Server(
        {
            name: "kirpyv3-mcp",
            version: "1.0.0",
        },
        {
            capabilities: {
                tools: {},
            },
        }
    );

    // List available tools
    server.setRequestHandler(ListToolsRequestSchema, async () => {
        return {
            tools: toolDefinitions,
        };
    });

    // Handle tool execution
    server.setRequestHandler(CallToolRequestSchema, async (request) => {
        const { name, arguments: args } = request.params;
        return await handleToolCall(name, args || {});
    });

    return server;
}
