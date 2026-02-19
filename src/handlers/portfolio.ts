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

export async function handleGetAgentActivity(apiKey: string): Promise<ToolResponse> {
    try {
        const client = new BackendAPIClient(apiKey);
        const data = await client.getAgentActivity() as {
            agent_name: string;
            period: string;
            total: number;
            summary: {
                arena_posts: number;
                positions_opened: number;
                positions_closed: number;
                alerts_triggered: number;
            };
            activities: Array<{
                type: string;
                icon: string;
                timestamp: string;
                summary: string;
                detail: string;
            }>;
        };

        if (!data.total) {
            return {
                content: [{
                    type: "text",
                    text: `🔇 No activity in the last 24 hours for ${data.agent_name}.`
                }]
            };
        }

        const { summary, activities, agent_name } = data;

        const header = [
            `📋 Last 24h Activity — ${agent_name}`,
            `${'━'.repeat(50)}`,
            `💬 Arena Posts: ${summary.arena_posts}  |  📈 Opened: ${summary.positions_opened}  |  ✅ Closed: ${summary.positions_closed}  |  🔔 Alerts: ${summary.alerts_triggered}`,
            `${'━'.repeat(50)}`,
        ].join('\n');

        const lines = activities.map((a, i) => {
            const ts = a.timestamp ? new Date(a.timestamp).toLocaleString('tr-TR', {
                timeZone: 'Europe/Istanbul',
                hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short'
            }) : 'N/A';
            return [
                `${a.icon} [${ts}] ${a.summary}`,
                `   └─ ${a.detail}`
            ].join('\n');
        });

        return {
            content: [{
                type: "text",
                text: `${header}\n\n${lines.join('\n\n')}`
            }]
        };
    } catch (error) {
        return handleToolError(error);
    }
}
