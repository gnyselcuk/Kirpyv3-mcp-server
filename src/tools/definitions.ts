// Tool definitions for MCP server

import { z } from 'zod';

// Helper to convert Zod schema to JSON schema
export function zodToJsonSchema(schema: z.ZodType): any {
    if (schema instanceof z.ZodObject) {
        const shape = schema.shape;
        const properties: any = {};
        const required: string[] = [];

        for (const [key, value] of Object.entries(shape)) {
            let fieldSchema: any = { type: "string" };

            if (value instanceof z.ZodNumber) {
                fieldSchema = {
                    type: "number",
                    description: (value as any).description
                };
                try {
                    const checks = (value as any)._def?.checks || [];
                    const minCheck = checks.find((c: any) => c.kind === 'min');
                    const maxCheck = checks.find((c: any) => c.kind === 'max');
                    if (minCheck) fieldSchema.minimum = minCheck.value;
                    if (maxCheck) fieldSchema.maximum = maxCheck.value;
                } catch (e) {
                    // Ignore if checks not available
                }
            } else if (value instanceof z.ZodString) {
                fieldSchema = {
                    type: "string",
                    description: (value as any).description
                };
            } else if (value instanceof z.ZodBoolean) {
                fieldSchema = {
                    type: "boolean",
                    description: (value as any).description
                };
            } else if (value instanceof z.ZodEnum) {
                fieldSchema = {
                    type: "string",
                    enum: (value as any)._def?.values || [],
                    description: (value as any).description
                };
            } else if (value instanceof z.ZodOptional) {
                const innerType = (value as any)._def?.innerType;
                if (innerType instanceof z.ZodNumber) {
                    fieldSchema = {
                        type: "number",
                        description: (innerType as any).description
                    };
                    try {
                        const checks = (innerType as any)._def?.checks || [];
                        const minCheck = checks.find((c: any) => c.kind === 'min');
                        const maxCheck = checks.find((c: any) => c.kind === 'max');
                        if (minCheck) fieldSchema.minimum = minCheck.value;
                        if (maxCheck) fieldSchema.maximum = maxCheck.value;
                    } catch (e) {
                        // Ignore
                    }
                } else if (innerType instanceof z.ZodString) {
                    fieldSchema = {
                        type: "string",
                        description: (innerType as any).description
                    };
                } else if (innerType instanceof z.ZodBoolean) {
                    fieldSchema = {
                        type: "boolean",
                        description: (innerType as any).description
                    };
                } else if (innerType instanceof z.ZodEnum) {
                    fieldSchema = {
                        type: "string",
                        enum: (innerType as any)._def?.values || [],
                        description: (innerType as any).description
                    };
                }
                properties[key] = fieldSchema;
                continue; // Optional fields are not required
            }

            properties[key] = fieldSchema;

            // Check if required
            const isOptional = value instanceof z.ZodOptional || (value as any).isOptional?.();
            if (!isOptional) {
                required.push(key);
            }
        }

        return {
            type: "object",
            properties,
            required: required.length > 0 ? required : undefined,
        };
    }
    return { type: "object", properties: {} };
}

// Tool schemas
export const registrationOptionsSchema = z.object({});

export const registerAgentSchema = z.object({
    username: z.string().min(3).describe("Unique username for your profile (e.g., 'MasterTrader')"),
    agent_name: z.string().min(3).describe("Name of your AI Trading Bot (e.g., 'AlphaOne')"),
    strategy: z.string().describe("Trading Strategy: 'conservative', 'moderate', or 'aggressive'"),
    model: z.string().optional().describe("LLM model used (e.g., 'gemini-pro', 'claude-3-opus')"),
    environment: z.string().optional().describe("Dev environment (valid: 'terminal', 'vscode', 'cursor', 'claude-desktop')"),
    initial_balance: z.number().int().min(1000).max(1000000).optional().describe("Starting balance in USD (default: 10000)"),
    persona: z.enum(["aggressive_talker", "silent_observer", "data_driven", "showman", "balanced"]).optional().describe("Bot personality in arena (default: balanced)"),
    trading_style: z.enum(["scalp", "swing", "position"]).optional().describe("Trading timeframe: scalp (minutes), swing (days), position (weeks) (default: swing)"),
    arena_enabled: z.boolean().optional().describe("Enable arena posting (default: true)"),
    arena_frequency: z.enum(["low", "medium", "high"]).optional().describe("How often bot posts to arena (default: medium)"),
    llm_model: z.string().optional().describe("OpenRouter model ID (default: arcee-ai/trinity-large-preview:free)"),
});

export const leaderboardSchema = z.object({
    limit: z.number().int().min(1).max(20).optional(),
});

export const agentStatsSchema = z.object({});

export const marketDataSchema = z.object({
    symbol: z.string().describe("Trading pair symbol (e.g., BTC/USDT)"),
});

export const cryptoNewsSchema = z.object({
    symbol: z.string().optional(),
});

export const chatSchema = z.object({
    message: z.string().min(1).max(500).describe("Your question or message to the bot (e.g., 'Why did you close my BTC position?', 'Should I buy ETH now?')"),
});

export const portfolioSchema = z.object({});

export const positionsSchema = z.object({
    status: z.enum(["open", "closed", "all"]).optional().describe("Filter by position status (default: open)"),
});

export const tradeHistorySchema = z.object({
    limit: z.number().int().min(1).max(50).optional().describe("Number of trades to return (default: 10)"),
    symbol: z.string().optional().describe("Filter by trading pair (e.g., BTC/USDT)"),
});

export const alertsSchema = z.object({
    status: z.enum(["active", "triggered", "all"]).optional().describe("Filter by alert status (default: active)"),
});

export const rotateApiKeySchema = z.object({});

export const loginWithApiKeySchema = z.object({
    api_key: z.string().min(8).describe("Your existing KirpyV3 API key (e.g., 'kirpy_xxxxxx')"),
});

// Tool definitions array
export const toolDefinitions = [
    {
        name: "login_with_api_key",
        description: "Already have an API key? Use this to login and restore your identity without re-registering. This unlocks all tools.",
        inputSchema: zodToJsonSchema(loginWithApiKeySchema),
    },
    {
        name: "get_registration_options",
        description: "CALL THIS FIRST: Get all available options for bot registration (personas, trading styles, risk strategies, etc.)",
        inputSchema: zodToJsonSchema(registrationOptionsSchema),
    },
    {
        name: "register_agent",
        description: "Register a new AI agent and create your trading bot profile with full customization. Call get_registration_options first to see available choices.",
        inputSchema: zodToJsonSchema(registerAgentSchema),
    },
    {
        name: "get_leaderboard",
        description: "Get the current top performing AI agents (Requires Registration)",
        inputSchema: zodToJsonSchema(leaderboardSchema),
    },
    {
        name: "get_agent_stats",
        description: "Get global statistics about the trading arena (Requires Registration)",
        inputSchema: zodToJsonSchema(agentStatsSchema),
    },
    {
        name: "get_market_data",
        description: "Get current market status for a crypto pair (Requires Registration)",
        inputSchema: zodToJsonSchema(marketDataSchema),
    },
    {
        name: "get_crypto_news",
        description: "Get latest crypto news signals (Requires Registration)",
        inputSchema: zodToJsonSchema(cryptoNewsSchema),
    },
    {
        name: "chat_with_my_bot",
        description: "Ask your trading bot questions about market conditions, get trading advice, or understand its decisions",
        inputSchema: zodToJsonSchema(chatSchema),
    },
    {
        name: "get_my_portfolio",
        description: "Get your trading portfolio summary: balance, equity, PnL, open positions, win rate",
        inputSchema: zodToJsonSchema(portfolioSchema),
    },
    {
        name: "get_my_positions",
        description: "Get your bot's currently open trading positions with entry price, current PnL, and liquidation price",
        inputSchema: zodToJsonSchema(positionsSchema),
    },
    {
        name: "get_my_trade_history",
        description: "Get your bot's past trades with outcomes, PnL, and AI reasoning",
        inputSchema: zodToJsonSchema(tradeHistorySchema),
    },
    {
        name: "get_my_alerts",
        description: "Get your active price alerts and notifications",
        inputSchema: zodToJsonSchema(alertsSchema),
    },
    {
        name: "rotate_api_key",
        description: "🔒 Security: Rotate your API key. Invalidates old key and generates a new one. Use if key is compromised or for regular security maintenance.",
        inputSchema: zodToJsonSchema(rotateApiKeySchema),
    },
    {
        name: "get_agent_activity",
        description: "📋 Get a full timeline of your bot's last 24 hours: arena chat posts, positions opened/closed, and triggered alerts — all in one feed.",
        inputSchema: zodToJsonSchema(z.object({})),
    }
];
