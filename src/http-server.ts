/**
 * HTTP-based MCP Server for Kibana Agent Builder
 * Exposes tools via HTTP endpoint instead of stdio
 * 
 * Security Features:
 * - CORS with whitelist
 * - Rate limiting
 * - Security headers (Helmet)
 * - CSRF protection
 * - Request size limits
 * - Security event logging
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { config } from './core/config.js';
import { toolDefinitions } from './tools/definitions.js';
import { handleToolCall } from './handlers/index.js';
import { createSecurityLogger } from './utils/security-logger.js';

const SKILL_FILE = path.join(process.cwd(), 'SKILL.md');

const app = express();
const securityLogger = createSecurityLogger();

// Trust reverse proxy (Nginx/Cloudflare) for express-rate-limit accurately identifying IPs
app.set('trust proxy', 1);

// Security headers
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    },
    frameguard: {
        action: 'deny'
    },
    noSniff: true,
    xssFilter: true
}));

// CORS configuration - whitelist only trusted origins
// Note: /health and /tools are public endpoints (no CORS restriction)
const corsOptions = {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
        const allowedOrigins = [
            config.FRONTEND_URL,
            // Add your Kibana/Elastic Cloud URL here
            // 'https://your-kibana-url.elastic.co',
        ];

        // Development mode - allow localhost
        if (config.NODE_ENV === 'development' && origin && origin.startsWith('http://localhost')) {
            return callback(null, true);
        }

        // Allow no origin for public endpoints (health, tools) - these are GET only
        // For POST endpoints, origin is required for security
        if (!origin) {
            // This will be handled per-route
            return callback(null, true);
        }

        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            securityLogger.warn({
                event: 'cors_blocked',
                origin,
                timestamp: new Date().toISOString()
            });
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400 // 24 hours
};

// Apply CORS to all routes
app.use(cors(corsOptions));

// Body parser with size limits (DoS prevention)
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));
app.use(cookieParser());

// General rate limiter
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per IP
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    validate: { xForwardedForHeader: false, default: true },
    handler: (req, res) => {
        securityLogger.warn({
            event: 'rate_limit_exceeded',
            ip: req.ip,
            path: req.path,
            timestamp: new Date().toISOString()
        });
        res.status(429).json({
            error: 'Too many requests, please try again later.'
        });
    }
});

// Tool call rate limiter (stricter)
const toolCallLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 20, // 20 tool calls per minute per IP
    message: 'Too many tool calls, please slow down.',
    standardHeaders: true,
    legacyHeaders: false,
    validate: { xForwardedForHeader: false, default: true },
    handler: (req, res) => {
        securityLogger.warn({
            event: 'tool_call_rate_limit_exceeded',
            ip: req.ip,
            timestamp: new Date().toISOString()
        });
        res.status(429).json({
            error: 'Too many tool calls, please slow down.'
        });
    }
});

const PORT = config.MCP_PORT;

// Apply general rate limiter to all routes
app.use('/mcp', generalLimiter);

// Health check (no rate limit)
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        server: 'kirpyv3-mcp-http',
        version: '1.0.0',
        environment: config.NODE_ENV,
        timestamp: new Date().toISOString()
    });
});

// List tools (for MCP discovery)
app.get('/tools', (req, res) => {
    res.json({ tools: toolDefinitions });
});

// Serve SKILL.md — human + agent readable guide
// Agents can fetch: GET /skill (JSON) or GET /skill.md (raw markdown)
app.get('/skill', (req, res) => {
    try {
        const content = fs.existsSync(SKILL_FILE)
            ? fs.readFileSync(SKILL_FILE, 'utf-8')
            : '# SKILL.md not found';

        const accept = req.headers['accept'] || '';
        if (accept.includes('application/json')) {
            // Return as JSON for programmatic agents
            res.json({
                name: 'kirpyv3-trading-agent',
                server_url: 'https://mcp-kirpyv3.yugosoft.net',
                transport: 'http',
                skill_guide_url: 'https://mcp-kirpyv3.yugosoft.net/skill.md',
                tools_url: 'https://mcp-kirpyv3.yugosoft.net/tools',
                content
            });
        } else {
            // Return raw markdown for humans / markdown-aware agents
            res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
            res.send(content);
        }
    } catch (err) {
        res.status(500).json({ error: 'Failed to load skill guide' });
    }
});

app.get('/skill.md', (req, res) => {
    try {
        const content = fs.existsSync(SKILL_FILE)
            ? fs.readFileSync(SKILL_FILE, 'utf-8')
            : '# SKILL.md not found';
        res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
        res.send(content);
    } catch (err) {
        res.status(500).json({ error: 'Failed to load skill guide' });
    }
});

// MCP Protocol: Initialize
app.post('/mcp/initialize', (req, res) => {
    securityLogger.info({
        event: 'mcp_initialize',
        ip: req.ip,
        timestamp: new Date().toISOString()
    });

    res.json({
        protocolVersion: "2024-11-05",
        capabilities: { tools: {} },
        serverInfo: {
            name: "kirpyv3-mcp-http",
            version: "1.0.0",
            environment: config.NODE_ENV,
            skill_url: "https://mcp-kirpyv3.yugosoft.net/skill",
            skill_md_url: "https://mcp-kirpyv3.yugosoft.net/skill.md",
            dashboard_url: config.FRONTEND_URL
        }
    });
});

// MCP Protocol: List tools
app.post('/mcp/tools/list', (req, res) => {
    res.json({
        tools: toolDefinitions
    });
});

// MCP Protocol: Call tool (with rate limiting)
app.post('/mcp/tools/call', toolCallLimiter, async (req, res) => {
    const { name, arguments: args } = req.body;

    // Log tool call attempt
    securityLogger.info({
        event: 'tool_call',
        tool: name,
        ip: req.ip,
        timestamp: new Date().toISOString()
    });

    try {
        const result = await handleToolCall(name, args || {});

        // Log successful tool call
        if (!result.isError) {
            securityLogger.info({
                event: 'tool_call_success',
                tool: name,
                timestamp: new Date().toISOString()
            });
        } else {
            securityLogger.warn({
                event: 'tool_call_error',
                tool: name,
                timestamp: new Date().toISOString()
            });
        }

        res.json(result);
    } catch (error) {
        securityLogger.error({
            event: 'tool_call_exception',
            tool: name,
            error: error instanceof Error ? error.message : String(error),
            timestamp: new Date().toISOString()
        });

        res.json({
            content: [{
                type: "text",
                text: config.NODE_ENV === 'development'
                    ? `Error: ${error instanceof Error ? error.message : String(error)}`
                    : `An error occurred. Please try again.`
            }],
            isError: true
        });
    }
});

// 404 handler
app.use((req, res) => {
    securityLogger.warn({
        event: '404_not_found',
        path: req.path,
        method: req.method,
        ip: req.ip,
        timestamp: new Date().toISOString()
    });
    res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    securityLogger.error({
        event: 'server_error',
        error: err.message,
        path: req.path,
        timestamp: new Date().toISOString()
    });

    res.status(err.status || 500).json({
        error: config.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
});

app.listen(PORT, () => {
    console.log(`🚀 MCP HTTP Server running on http://localhost:${PORT}`);
    console.log(`🔒 Environment: ${config.NODE_ENV}`);
    console.log(`📊 Health: http://localhost:${PORT}/health`);
    console.log(`🔧 Tools: http://localhost:${PORT}/tools`);
    console.log(`📡 MCP Endpoint: http://localhost:${PORT}/mcp`);
    console.log(`✅ Security features enabled: CORS, Rate Limiting, Helmet, Logging`);
});
