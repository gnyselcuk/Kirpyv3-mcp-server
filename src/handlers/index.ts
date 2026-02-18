// Handler registry - routes tool calls to appropriate handlers

import { ToolResponse } from '../types/index.js';
import { loadIdentity } from '../core/identity.js';
import { AuthenticationError } from '../utils/errors.js';
import { handleToolError } from '../utils/error-handler.js';
import { Validators } from '../utils/validators.js';

// Import handlers
import { handleGetRegistrationOptions, handleRegisterAgent, handleRotateApiKey } from './registration.js';
import { handleGetLeaderboard, handleGetAgentStats, handleGetMarketData, handleGetCryptoNews } from './market.js';
import { handleGetPortfolio, handleGetPositions, handleGetTradeHistory, handleGetAlerts, handleChatWithBot } from './portfolio.js';

export async function handleToolCall(name: string, args: any): Promise<ToolResponse> {
    const identity = await loadIdentity();

    // Enforce Registration for all tools except 'register_agent' and 'get_registration_options'
    if (name !== "register_agent" && name !== "get_registration_options" && !identity) {
        return {
            content: [{
                type: "text",
                text: `⛔ ACCESS DENIED: You are not registered in the KirpyV3 system.\n\nPlease call the 'register_agent' tool first to obtain your API Key and Identity.\n\nUsage: register_agent(username="YourName", agent_name="BotName", strategy="moderate")`
            }],
            isError: true
        };
    }

    try {
        // Registration tools (no auth required)
        if (name === "get_registration_options") {
            return await handleGetRegistrationOptions();
        }

        if (name === "register_agent") {
            return await handleRegisterAgent(args);
        }

        // All other tools require authentication
        if (!identity) {
            throw new AuthenticationError();
        }

        const apiKey = identity.api_key;
        
        // Validate API key format for security
        if (!Validators.validateApiKeyFormat(apiKey)) {
            throw new AuthenticationError('Invalid API key format. Please re-register.');
        }

        // Market data tools
        if (name === "get_leaderboard") {
            return await handleGetLeaderboard(apiKey, args);
        }

        if (name === "get_agent_stats") {
            return await handleGetAgentStats(apiKey);
        }

        if (name === "get_market_data") {
            return await handleGetMarketData(apiKey, args);
        }

        if (name === "get_crypto_news") {
            return await handleGetCryptoNews(apiKey, args);
        }

        // Portfolio & trading tools
        if (name === "get_my_portfolio") {
            return await handleGetPortfolio(apiKey);
        }

        if (name === "get_my_positions") {
            return await handleGetPositions(apiKey, args);
        }

        if (name === "get_my_trade_history") {
            return await handleGetTradeHistory(apiKey, args);
        }

        if (name === "get_my_alerts") {
            return await handleGetAlerts(apiKey, args);
        }

        if (name === "chat_with_my_bot") {
            return await handleChatWithBot(apiKey, args);
        }

        // Security tools
        if (name === "rotate_api_key") {
            return await handleRotateApiKey();
        }

        // Unknown tool
        return {
            content: [{
                type: "text",
                text: `Unknown tool: ${name}`
            }],
            isError: true
        };
    } catch (error) {
        return handleToolError(error);
    }
}
