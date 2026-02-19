// Backend API client to eliminate code duplication

import { config } from '../core/config.js';
import { BackendAPIError, NotFoundError } from './errors.js';

export class BackendAPIClient {
    private baseUrl: string;
    private apiKey?: string;
    private timeout: number;

    constructor(apiKey?: string) {
        this.baseUrl = config.BACKEND_URL;
        this.apiKey = apiKey;
        this.timeout = config.REQUEST_TIMEOUT;
    }

    setApiKey(apiKey: string): void {
        this.apiKey = apiKey;
    }

    private async request<T>(
        endpoint: string,
        options?: RequestInit
    ): Promise<T> {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            ...options?.headers as Record<string, string>
        };

        if (this.apiKey) {
            headers['Authorization'] = `Bearer ${this.apiKey}`;
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                ...options,
                headers,
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                if (response.status === 404) {
                    const error = await response.json().catch(() => ({ detail: 'Not found' }));
                    throw new NotFoundError(error.detail || 'Resource not found');
                }

                const error = await response.json().catch(() => ({ detail: response.statusText }));
                throw new BackendAPIError(error.detail || response.statusText, response.status);
            }

            return response.json();
        } catch (error) {
            clearTimeout(timeoutId);
            if (error instanceof NotFoundError || error instanceof BackendAPIError) {
                throw error;
            }
            throw new BackendAPIError(
                error instanceof Error ? error.message : String(error),
                500
            );
        }
    }

    // User & Auth endpoints
    async registerUser(username: string, model?: string, environment?: string) {
        return this.request('/api/auth/register', {
            method: 'POST',
            body: JSON.stringify({ username, model, environment })
        });
    }

    async createAgent(agentData: any) {
        return this.request('/api/user/agent', {
            method: 'POST',
            body: JSON.stringify(agentData)
        });
    }

    // Leaderboard endpoints
    async getLeaderboard(limit: number = 5) {
        return this.request(`/api/leaderboard?limit=${limit}`);
    }

    async getAgentStats() {
        return this.request('/api/leaderboard/stats');
    }

    // Market endpoints
    async getMarketData(symbol: string) {
        return this.request(`/api/market/status?symbol=${encodeURIComponent(symbol)}`);
    }

    async getCryptoNews(symbol?: string) {
        const url = symbol
            ? `/api/market/news?symbol=${encodeURIComponent(symbol)}`
            : '/api/market/news';
        return this.request(url);
    }

    // User portfolio & trading endpoints
    async getPortfolio() {
        return this.request('/api/user/performance');
    }

    async getOpenPositions() {
        return this.request('/api/trading/positions/open');
    }

    async getPositionHistory() {
        return this.request('/api/trading/positions/history');
    }

    async getTradeHistory(limit: number = 10, symbol?: string) {
        let url = `/api/user/trades?limit=${limit}`;
        if (symbol) url += `&symbol=${encodeURIComponent(symbol)}`;
        return this.request(url);
    }

    async getAlerts(status: string = 'active') {
        return this.request(`/api/alerts/my-alerts?status=${status}`);
    }

    // Chat endpoint
    async chatWithBot(message: string) {
        return this.request('/api/user/chat', {
            method: 'POST',
            body: JSON.stringify({ message })
        });
    }

    // API Key rotation
    async rotateApiKey() {
        return this.request('/api/auth/rotate-key', {
            method: 'POST'
        });
    }

    // Activity feed
    async getAgentActivity() {
        return this.request('/api/user/activity');
    }

    // Arena endpoints
    async postToArena(message: string, sentiment?: string) {
        return this.request('/api/arena/post', {
            method: 'POST',
            body: JSON.stringify({ message, sentiment })
        });
    }
}
