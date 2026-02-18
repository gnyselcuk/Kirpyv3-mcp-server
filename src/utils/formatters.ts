// Response formatters for consistent output

import { PortfolioData, Position, Trade, Alert } from '../types/index.js';

export class ResponseFormatter {
    static portfolio(data: PortfolioData): string {
        return `
📊 Portfolio Summary
${'━'.repeat(50)}
💰 Balance: $${data.balance?.toFixed(2) || '0.00'}
📈 Equity: $${data.equity?.toFixed(2) || '0.00'}
${data.unrealized_pnl !== undefined ? `💵 Unrealized PnL: $${data.unrealized_pnl.toFixed(2)} ${data.unrealized_pnl >= 0 ? '📈' : '📉'}` : ''}
${data.realized_pnl !== undefined ? `💸 Realized PnL: $${data.realized_pnl.toFixed(2)}` : ''}
📊 Open Positions: ${data.open_positions || 0}
${data.win_rate !== undefined ? `🎯 Win Rate: ${(data.win_rate * 100).toFixed(1)}%` : ''}
${data.total_trades !== undefined ? `📝 Total Trades: ${data.total_trades}` : ''}
${'━'.repeat(50)}
        `.trim();
    }

    static position(pos: Position): string {
        const pnlEmoji = (pos.unrealized_pnl || 0) >= 0 ? '📈' : '📉';
        const sideEmoji = pos.side === 'LONG' ? '🟢' : '🔴';
        
        return `
${sideEmoji} ${pos.symbol} ${pos.side} ${pos.leverage}x
   Entry: $${pos.entry_price?.toFixed(2)} | Current: $${pos.current_price?.toFixed(2)}
   ${pnlEmoji} PnL: $${pos.unrealized_pnl?.toFixed(2)} (${pos.pnl_percentage?.toFixed(2)}%)
   ${pos.liquidation_price ? `⚠️  Liquidation: $${pos.liquidation_price.toFixed(2)}` : ''}
   📅 Opened: ${new Date(pos.opened_at).toLocaleString()}
        `.trim();
    }

    static positions(positions: Position[], status: string): string {
        if (!positions || positions.length === 0) {
            return `No ${status} positions found.`;
        }

        let formatted = `\n📊 Your ${status.toUpperCase()} Positions (${positions.length})\n${'━'.repeat(50)}\n\n`;
        
        for (const pos of positions) {
            formatted += this.position(pos) + '\n\n';
        }
        
        return formatted.trim();
    }

    static trade(trade: Trade): string {
        const pnlEmoji = (trade.pnl || 0) >= 0 ? '✅' : '❌';
        const sideEmoji = trade.side === 'LONG' ? '🟢' : '🔴';
        
        return `
${pnlEmoji} ${sideEmoji} ${trade.symbol} ${trade.side} ${trade.leverage}x
   Entry: $${trade.entry_price?.toFixed(2)} | Exit: $${trade.exit_price?.toFixed(2)}
   PnL: $${trade.pnl?.toFixed(2)} (${trade.pnl_percentage?.toFixed(2)}%)
   ${trade.reason ? `💭 Reason: ${trade.reason}` : ''}
   📅 ${new Date(trade.closed_at).toLocaleString()}
        `.trim();
    }

    static tradeHistory(trades: Trade[]): string {
        if (!trades || trades.length === 0) {
            return 'No trade history found.';
        }

        let formatted = `\n📜 Trade History (${trades.length} trades)\n${'━'.repeat(50)}\n\n`;
        
        for (const trade of trades) {
            formatted += this.trade(trade) + '\n\n';
        }
        
        return formatted.trim();
    }

    static alert(alert: Alert): string {
        const statusEmoji = alert.status === 'active' ? '🟢' : alert.status === 'triggered' ? '🔴' : '⚪';
        const conditionText = alert.condition_type === 'above' ? '📈 Above' : '📉 Below';
        
        return `
${statusEmoji} ${alert.symbol} ${conditionText} $${alert.threshold?.toFixed(2)}
   Status: ${alert.status}
   📅 Created: ${new Date(alert.created_at).toLocaleString()}
   ${alert.triggered_at ? `⏰ Triggered: ${new Date(alert.triggered_at).toLocaleString()}` : ''}
        `.trim();
    }

    static alerts(alerts: Alert[], status: string): string {
        if (!alerts || alerts.length === 0) {
            return `No ${status} alerts found.`;
        }

        let formatted = `\n🔔 Your ${status.toUpperCase()} Alerts (${alerts.length})\n${'━'.repeat(50)}\n\n`;
        
        for (const alert of alerts) {
            formatted += this.alert(alert) + '\n\n';
        }
        
        return formatted.trim();
    }

    static chatResponse(response: string, context?: string): string {
        return `
🤖 Your Bot Says:
${'━'.repeat(50)}
${response}

${context ? `\n📊 Context Used:\n${context}` : ''}
${'━'.repeat(50)}
        `.trim();
    }

    static error(message: string, code?: string): string {
        return `❌ Error${code ? ` [${code}]` : ''}: ${message}`;
    }

    static success(message: string): string {
        return `✅ ${message}`;
    }
}
