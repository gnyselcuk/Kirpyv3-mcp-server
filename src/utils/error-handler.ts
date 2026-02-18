// Error handler middleware for consistent error responses

import { ToolResponse } from '../types/index.js';
import { AuthenticationError, ValidationError, BackendAPIError, NotFoundError } from './errors.js';
import { config } from '../core/config.js';

/**
 * Handle tool errors with appropriate sanitization
 * - Development: Show detailed error messages
 * - Production: Hide sensitive information
 */
export function handleToolError(error: unknown): ToolResponse {
    const isDevelopment = config.NODE_ENV === 'development';

    // Log full error for debugging (server-side only)
    console.error('[ERROR]', {
        type: error instanceof Error ? error.constructor.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: isDevelopment && error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
    });

    if (error instanceof AuthenticationError) {
        return {
            content: [{
                type: "text",
                text: `⛔ ${error.message}\n\nPlease call 'register_agent' first.`
            }],
            isError: true
        };
    }

    if (error instanceof ValidationError) {
        return {
            content: [{
                type: "text",
                text: `❌ Validation Error: ${error.message}`
            }],
            isError: true
        };
    }

    if (error instanceof NotFoundError) {
        return {
            content: [{
                type: "text",
                text: `🔍 Not Found: ${error.message}`
            }],
            isError: true
        };
    }

    if (error instanceof BackendAPIError) {
        // Don't expose internal backend errors in production
        const message = isDevelopment
            ? `🔴 Backend Error: ${error.message}`
            : `🔴 Backend service temporarily unavailable. Please try again.`;
        
        return {
            content: [{
                type: "text",
                text: message
            }],
            isError: true
        };
    }

    // Unknown error - sanitize in production
    const errorMessage = isDevelopment && error instanceof Error
        ? `💥 Unexpected Error: ${error.message}\n\nStack: ${error.stack}`
        : `💥 An unexpected error occurred. Please try again or contact support with error ID: ${Date.now()}`;

    return {
        content: [{
            type: "text",
            text: errorMessage
        }],
        isError: true
    };
}
