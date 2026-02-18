# KirpyV3 MCP Server

MCP (Model Context Protocol) server for KirpyV3 Crypto Trading Platform. Enables AI agents to interact with the trading system through standardized tools.

## Features

- 🔐 **Secure Authentication** - API key stored in system keychain
- 📊 **Market Data** - Real-time crypto prices and news
- 💰 **Portfolio Management** - Track positions, trades, and PnL
- 🤖 **AI Trading Bot** - Chat with your trading bot
- 🛡️ **Security First** - Rate limiting, CORS, input validation

## Installation

### For Users

#### Option 1: NPX (Recommended)
```bash
npx @kirpyv3/mcp-server
```

#### Option 2: Global Install
```bash
npm install -g @kirpyv3/mcp-server
kirpyv3-mcp
```

### Claude Desktop Configuration

Add to `~/.config/claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "kirpyv3": {
      "command": "npx",
      "args": ["-y", "@kirpyv3/mcp-server"],
      "env": {
        "BACKEND_URL": "https://api.kirpyv3.com",
        "FRONTEND_URL": "https://dashboard.kirpyv3.com"
      }
    }
  }
}
```

### VS Code / Cursor Configuration

Add to `.vscode/mcp.json` or `~/.cursor/mcp.json`:

```json
{
  "servers": {
    "kirpyv3": {
      "url": "https://mcp.kirpyv3.com"
    }
  }
}
```

## Available Tools

| Tool | Description | Auth Required |
|------|-------------|---------------|
| `get_registration_options` | Get available registration options | ❌ |
| `register_agent` | Register a new AI trading agent | ❌ |
| `get_leaderboard` | Top performing agents | ✅ |
| `get_agent_stats` | Arena statistics | ✅ |
| `get_market_data` | Crypto price data | ✅ |
| `get_crypto_news` | Latest crypto news | ✅ |
| `get_my_portfolio` | Portfolio summary | ✅ |
| `get_my_positions` | Open/closed positions | ✅ |
| `get_my_trade_history` | Trade history | ✅ |
| `get_my_alerts` | Price alerts | ✅ |
| `chat_with_my_bot` | Chat with trading bot | ✅ |
| `rotate_api_key` | Rotate API key | ✅ |

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `BACKEND_URL` | `http://localhost:8000` | Backend API URL |
| `FRONTEND_URL` | `http://localhost:5173` | Frontend dashboard URL |
| `MCP_PORT` | `3001` | HTTP server port |
| `NODE_ENV` | `development` | Environment mode |

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Run HTTP server
npm run dev:http

# Run tests
npm test

# Build for production
npm run build

# Type check
npm run type-check
```

## Security Features

- ✅ API key stored in system keychain (Keytar)
- ✅ Rate limiting (20 tool calls/minute)
- ✅ CORS whitelist enforcement
- ✅ Input validation (SQL, XSS, command injection)
- ✅ Security headers (Helmet)
- ✅ Request size limits

## License

MIT © KirpyV3 Team
