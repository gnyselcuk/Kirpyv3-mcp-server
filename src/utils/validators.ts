// Input validators for tool arguments with enhanced security

import { ValidationError } from './errors.js';

export class Validators {
    /**
     * Sanitize and validate username
     */
    static validateUsername(username: string): void {
        if (!username || username.length < 3) {
            throw new ValidationError('Username must be at least 3 characters long');
        }
        if (username.length > 50) {
            throw new ValidationError('Username must be less than 50 characters');
        }
        if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
            throw new ValidationError('Username can only contain letters, numbers, underscores, and hyphens');
        }
    }

    static validateAgentName(agentName: string): void {
        if (!agentName || agentName.length < 3) {
            throw new ValidationError('Agent name must be at least 3 characters long');
        }
        if (agentName.length > 50) {
            throw new ValidationError('Agent name must be less than 50 characters');
        }
    }

    static validateStrategy(strategy: string): void {
        const validStrategies = ['conservative', 'moderate', 'aggressive'];
        if (!validStrategies.includes(strategy)) {
            throw new ValidationError(
                `Invalid strategy: '${strategy}'. Available options: ${validStrategies.join(', ')}`
            );
        }
    }

    static validatePersona(persona?: string): void {
        if (!persona) return;
        const validPersonas = ['aggressive_talker', 'silent_observer', 'data_driven', 'showman', 'balanced'];
        if (!validPersonas.includes(persona)) {
            throw new ValidationError(
                `Invalid persona: '${persona}'. Available options: ${validPersonas.join(', ')}`
            );
        }
    }

    static validateTradingStyle(style?: string): void {
        if (!style) return;
        const validStyles = ['scalp', 'swing', 'position'];
        if (!validStyles.includes(style)) {
            throw new ValidationError(
                `Invalid trading style: '${style}'. Available options: ${validStyles.join(', ')}`
            );
        }
    }

    static validateArenaFrequency(frequency?: string): void {
        if (!frequency) return;
        const validFrequencies = ['low', 'medium', 'high'];
        if (!validFrequencies.includes(frequency)) {
            throw new ValidationError(
                `Invalid arena frequency: '${frequency}'. Available options: ${validFrequencies.join(', ')}`
            );
        }
    }

    static validateInitialBalance(balance?: number): void {
        if (balance === undefined) return;
        if (balance < 1000) {
            throw new ValidationError('Initial balance must be at least $1,000');
        }
        if (balance > 1000000) {
            throw new ValidationError('Initial balance cannot exceed $1,000,000');
        }
    }

    static validateSymbol(symbol: string): void {
        if (!symbol || symbol.length === 0) {
            throw new ValidationError('Symbol is required');
        }
        // Basic format check for crypto pairs
        if (!/^[A-Z0-9]+\/[A-Z0-9]+$/.test(symbol)) {
            throw new ValidationError('Symbol must be in format: BTC/USDT');
        }
    }

    /**
     * Enhanced message validation with security checks
     * - XSS prevention
     * - SQL injection prevention
     * - Command injection prevention
     */
    static validateMessage(message: string): void {
        if (!message || message.trim().length === 0) {
            throw new ValidationError('Message cannot be empty');
        }
        if (message.length > 500) {
            throw new ValidationError('Message must be less than 500 characters');
        }

        // Check for SQL injection patterns
        const sqlPatterns = /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi;
        if (sqlPatterns.test(message)) {
            throw new ValidationError('Message contains forbidden SQL keywords');
        }

        // Check for command injection characters
        const cmdPatterns = /[;&|`$(){}[\]<>]/;
        if (cmdPatterns.test(message)) {
            throw new ValidationError('Message contains forbidden special characters');
        }

        // Check for script tags (XSS)
        if (/<script|javascript:|onerror=|onload=/i.test(message)) {
            throw new ValidationError('Message contains forbidden HTML/JavaScript');
        }
    }

    static validateLimit(limit?: number): void {
        if (limit === undefined) return;
        if (limit < 1) {
            throw new ValidationError('Limit must be at least 1');
        }
        if (limit > 50) {
            throw new ValidationError('Limit cannot exceed 50');
        }
    }

    /**
     * Validate API key format (enhanced)
     */
    static validateApiKeyFormat(apiKey: string): boolean {
        // 1. Minimum length check (secure)
        if (apiKey.length < 48) {
            return false;
        }

        // 2. Maximum length check (DoS prevention)
        if (apiKey.length > 100) {
            return false;
        }

        // 3. Prefix check
        if (!apiKey.startsWith('ci_')) {
            return false;
        }

        // 4. Format check: ci_u{hex}_{token}
        const parts = apiKey.split('_');
        if (parts.length < 3) {
            return false;
        }

        // 5. User ID format check
        const userId = parts[1];
        if (!userId.startsWith('u') || userId.length !== 9) {
            return false;
        }

        // 6. Token part should only contain URL-safe characters
        const token = parts.slice(2).join('_');
        if (!/^[A-Za-z0-9_-]+$/.test(token)) {
            return false;
        }

        return true;
    }
}
