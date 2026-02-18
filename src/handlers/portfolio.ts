// Portfolio and trading tool handlers

import { ToolResponse, PositionsArgs, TradeHistoryArgs, AlertsArgs, ChatArgs, PositionsResponse, TradeHistoryResponse, AlertsResponse, ChatResponse, PortfolioData } from '../types/index.js';
import { BackendAPIClient } from '../utils/api-client.js';
import { ResponseFormatter } from '../utils/formatters.js';
import { Validators } from '../utils/validators.js';
import { handleToolError } from '../utils/error-handler.js';
import { NotFoundError } from '../utils/errors.js';

export async function handleGetPortfolio(apiKey: string): Promise<ToolResponse> {
    try {
        const client = new BackendAPIClient(apiKey);
        const data = await client.getPortfolio() as PortfolioData;
        
        return {
            content: [{
                type: "text",
                text: ResponseFormatter.portfolio(data)
            }]
        };
    } catch (error) {
        if (error instanceof NotFoundError) {
            return {
                content: [{
                    type: "text",
                    text: "No portfolio data found. Create an agent first."
                }]
            };
        }
        return handleToolError(error);
    }
}

export async function handleGetPositions(apiKey: string, args: PositionsArgs): Promise<ToolResponse> {
    try {
        const status = args.status || "open";
        const client = new BackendAPIClient(apiKey);
        
        let data: PositionsResponse;
        if (status === "open") {
            data = await client.getOpenPositions() as PositionsResponse;
        } else {
            data = await client.getPositionHistory() as PositionsResponse;
        }
        
        return {
            content: [{
                type: "text",
                text: ResponseFormatter.positions(data.positions, status)
            }]
        };
    } catch (error) {
        if (error instanceof NotFoundError) {
            return {
                content: [{
                    type: "text",
                    text: `No ${args.status || 'open'} positions found.`
                }]
            };
        }
        return handleToolError(error);
    }
}

export async function handleGetTradeHistory(apiKey: string, args: TradeHistoryArgs): Promise<ToolResponse> {
    try {
        const limit = args.limit || 10;
        Validators.validateLimit(limit);
        
        if (args.symbol) {
            Validators.validateSymbol(args.symbol);
        }

        const client = new BackendAPIClient(apiKey);
        const data = await client.getTradeHistory(limit, args.symbol) as TradeHistoryResponse;
        
        return {
            content: [{
                type: "text",
                text: ResponseFormatter.tradeHistory(data.trades)
            }]
        };
    } catch (error) {
        return handleToolError(error);
    }
}

export async function handleGetAlerts(apiKey: string, args: AlertsArgs): Promise<ToolResponse> {
    try {
        const status = args.status || "active";
        const client = new BackendAPIClient(apiKey);
        const data = await client.getAlerts(status) as AlertsResponse;
        
        return {
            content: [{
                type: "text",
                text: ResponseFormatter.alerts(data.alerts, status)
            }]
        };
    } catch (error) {
        if (error instanceof NotFoundError) {
            return {
                content: [{
                    type: "text",
                    text: `No ${args.status || 'active'} alerts found.`
                }]
            };
        }
        return handleToolError(error);
    }
}

export async function handleChatWithBot(apiKey: string, args: ChatArgs): Promise<ToolResponse> {
    try {
        Validators.validateMessage(args.message);

        const client = new BackendAPIClient(apiKey);
        const data = await client.chatWithBot(args.message) as ChatResponse;
        
        return {
            content: [{
                type: "text",
                text: ResponseFormatter.chatResponse(data.response, data.context)
            }]
        };
    } catch (error) {
        return handleToolError(error);
    }
}
