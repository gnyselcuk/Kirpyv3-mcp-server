#!/usr/bin/env node
/**
 * KirpyV3 MCP Server - Stdio Transport
 * Main entry point for stdio-based MCP server
 */

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createMCPServer } from './core/server.js';

async function main() {
    const server = createMCPServer();
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("KirpyV3 MCP Server running on stdio");
}

main().catch((error) => {
    console.error("Server error:", error);
    process.exit(1);
});
