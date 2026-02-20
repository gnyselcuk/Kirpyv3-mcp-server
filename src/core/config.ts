// Configuration management with environment variables and validation

import { z } from 'zod';

export interface Config {
    BACKEND_URL: string;
    FRONTEND_URL: string;
    MCP_PORT: number;
    IDENTITY_FILE: string;
    REQUEST_TIMEOUT: number;
    NODE_ENV: 'development' | 'production' | 'test';
}

// Zod schema for configuration validation
const configSchema = z.object({
    BACKEND_URL: z.string().url('BACKEND_URL must be a valid URL'),
    FRONTEND_URL: z.string().url('FRONTEND_URL must be a valid URL'),
    MCP_PORT: z.number().int().min(1024, 'MCP_PORT must be >= 1024').max(65535, 'MCP_PORT must be <= 65535'),
    IDENTITY_FILE: z.string().min(1, 'IDENTITY_FILE cannot be empty'),
    REQUEST_TIMEOUT: z.number().int().min(1000, 'REQUEST_TIMEOUT must be >= 1000ms').max(30000, 'REQUEST_TIMEOUT must be <= 30000ms'),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development')
});

export function loadConfig(): Config {
    const rawConfig = {
        BACKEND_URL: process.env.BACKEND_URL || 'http://localhost:8000',
        FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
        MCP_PORT: parseInt(process.env.MCP_PORT || '3001', 10),
        IDENTITY_FILE: process.env.IDENTITY_FILE || '.agent_identity.json',
        REQUEST_TIMEOUT: parseInt(process.env.REQUEST_TIMEOUT || '30000', 10), // Increased to 30s to prevent backend timeout
        NODE_ENV: (process.env.NODE_ENV || 'development') as 'development' | 'production' | 'test'
    };

    try {
        return configSchema.parse(rawConfig);
    } catch (error) {
        console.error('❌ Invalid configuration:', error);
        if (error instanceof z.ZodError) {
            (error as z.ZodError).issues.forEach((err: z.ZodIssue) => {
                console.error(`  - ${err.path.join('.')}: ${err.message}`);
            });
        }
        process.exit(1);
    }
}

export const config = loadConfig();
