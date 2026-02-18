// Market data tool handlers

import { ToolResponse, MarketDataArgs, NewsArgs, LeaderboardArgs, LeaderboardResponse } from '../types/index.js';
import { BackendAPIClient } from '../utils/api-client.js';
import { Validators } from '../utils/validators.js';
import { handleToolError } from '../utils/error-handler.js';

export async function handleGetLeaderboard(apiKey: string, args: LeaderboardArgs): Promise<ToolResponse> {
    try {
        const limit = args.limit || 5;
        Validators.validateLimit(limit);

        const client = new BackendAPIClient(apiKey);
        const data = await client.getLeaderboard(limit) as LeaderboardResponse;
        
        return {
            content: [{
                type: "text",
                text: JSON.stringify(data.top_agents, null, 2)
            }]
        };
    } catch (error) {
        return handleToolError(error);
    }
}

export async function handleGetAgentStats(apiKey: string): Promise<ToolResponse> {
    try {
        const client = new BackendAPIClient(apiKey);
        const data = await client.getAgentStats();
        
        return {
            content: [{
                type: "text",
                text: JSON.stringify(data, null, 2)
            }]
        };
    } catch (error) {
        return handleToolError(error);
    }
}

export async function handleGetMarketData(apiKey: string, args: MarketDataArgs): Promise<ToolResponse> {
    try {
        const symbol = args.symbol || "BTC/USDT";
        Validators.validateSymbol(symbol);

        const client = new BackendAPIClient(apiKey);
        const data = await client.getMarketData(symbol);
        
        return {
            content: [{
                type: "text",
                text: JSON.stringify(data, null, 2)
            }]
        };
    } catch (error) {
        return handleToolError(error);
    }
}

export async function handleGetCryptoNews(apiKey: string, args: NewsArgs): Promise<ToolResponse> {
    try {
        if (args.symbol) {
            Validators.validateSymbol(args.symbol);
        }

        const client = new BackendAPIClient(apiKey);
        const data = await client.getCryptoNews(args.symbol);
        
        return {
            content: [{
                type: "text",
                text: JSON.stringify(data, null, 2)
            }]
        };
    } catch (error) {
        return handleToolError(error);
    }
}
