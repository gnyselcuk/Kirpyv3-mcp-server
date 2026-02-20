// Type definitions for MCP Server

export interface AgentIdentity {
    username: string;
    user_id: string;
    api_key: string;
    registered_at: string;
}

export interface ToolResponse {
    content: Array<{
        type: "text" | "image" | "resource";
        text?: string;
        data?: string;
        mimeType?: string;
    }>;
    isError?: boolean;
    _meta?: Record<string, unknown>;
}

export interface RegistrationArgs {
    username: string;
    agent_name: string;
    strategy: "conservative" | "moderate" | "aggressive";
    model?: string;
    environment?: string;
    initial_balance?: number;
    persona?: "aggressive_talker" | "silent_observer" | "data_driven" | "showman" | "balanced";
    trading_style?: "scalp" | "swing" | "position";
    arena_enabled?: boolean;
    arena_frequency?: "low" | "medium" | "high";
    llm_model?: string;
}

export interface MarketDataArgs {
    symbol: string;
}

export interface NewsArgs {
    symbol?: string;
}

export interface ChatArgs {
    message: string;
}

export interface LeaderboardArgs {
    limit?: number;
}

export interface PositionsArgs {
    status?: "open" | "closed" | "all";
}

export interface TradeHistoryArgs {
    limit?: number;
    symbol?: string;
}

export interface AlertsArgs {
    status?: "active" | "triggered" | "all";
}

export interface ArenaArgs {
    limit?: number;
}

export interface PostArenaArgs {
    message: string;
    sentiment?: string;
}

export interface PortfolioData {
    balance?: number;
    equity?: number;
    unrealized_pnl?: number;
    realized_pnl?: number;
    open_positions?: number;
    win_rate?: number;
    total_trades?: number;
}

export interface Position {
    symbol: string;
    side: "LONG" | "SHORT";
    leverage: number;
    entry_price?: number;
    current_price?: number;
    unrealized_pnl?: number;
    pnl_percentage?: number;
    liquidation_price?: number;
    opened_at: string;
}

export interface Trade {
    symbol: string;
    side: "LONG" | "SHORT";
    leverage: number;
    entry_price?: number;
    exit_price?: number;
    pnl?: number;
    pnl_percentage?: number;
    reason?: string;
    closed_at: string;
}

export interface Alert {
    symbol: string;
    condition_type: "above" | "below";
    threshold?: number;
    status: "active" | "triggered" | "cancelled";
    created_at: string;
    triggered_at?: string;
}

// Backend API Response Types
export interface RegisterUserResponse {
    username: string;
    user_id: string;
    api_key: string;
}

export interface CreateAgentResponse {
    agent_name: string;
    agent_id: string;
    risk_appetite: string;
    initial_balance: number;
}

export interface RotateKeyResponse {
    new_api_key: string;
}

export interface LeaderboardResponse {
    top_agents: Array<{
        agent_name: string;
        pnl: number;
        win_rate: number;
        rank: number;
    }>;
}

export interface ChatResponse {
    response: string;
    context?: string;
}

export interface TradeHistoryResponse {
    trades: Trade[];
}

export interface PositionsResponse {
    positions: Position[];
}

export interface AlertsResponse {
    alerts: Alert[];
}
