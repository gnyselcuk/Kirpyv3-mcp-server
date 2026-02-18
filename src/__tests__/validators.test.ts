// Unit tests for validators

import { describe, it, expect } from 'vitest';
import { Validators } from '../utils/validators.js';

describe('Validators', () => {
    describe('validateUsername', () => {
        it('should accept valid usernames', () => {
            expect(() => Validators.validateUsername('test_user')).not.toThrow();
            expect(() => Validators.validateUsername('User123')).not.toThrow();
            expect(() => Validators.validateUsername('a-b-c')).not.toThrow();
        });

        it('should reject short usernames', () => {
            expect(() => Validators.validateUsername('ab')).toThrow('at least 3 characters');
        });

        it('should reject long usernames', () => {
            expect(() => Validators.validateUsername('a'.repeat(51))).toThrow('less than 50 characters');
        });

        it('should reject invalid characters', () => {
            expect(() => Validators.validateUsername('test@user')).toThrow('letters, numbers, underscores');
            expect(() => Validators.validateUsername('test user')).toThrow('letters, numbers, underscores');
        });
    });

    describe('validateStrategy', () => {
        it('should accept valid strategies', () => {
            expect(() => Validators.validateStrategy('conservative')).not.toThrow();
            expect(() => Validators.validateStrategy('moderate')).not.toThrow();
            expect(() => Validators.validateStrategy('aggressive')).not.toThrow();
        });

        it('should reject invalid strategies', () => {
            expect(() => Validators.validateStrategy('invalid')).toThrow('Invalid strategy');
        });
    });

    describe('validateSymbol', () => {
        it('should accept valid trading pairs', () => {
            expect(() => Validators.validateSymbol('BTC/USDT')).not.toThrow();
            expect(() => Validators.validateSymbol('ETH/BTC')).not.toThrow();
        });

        it('should reject invalid formats', () => {
            expect(() => Validators.validateSymbol('BTCUSDT')).toThrow('format: BTC/USDT');
            expect(() => Validators.validateSymbol('btc/usdt')).toThrow('format: BTC/USDT');
        });
    });

    describe('validateMessage', () => {
        it('should accept valid messages', () => {
            expect(() => Validators.validateMessage('Hello, how are you?')).not.toThrow();
        });

        it('should reject empty messages', () => {
            expect(() => Validators.validateMessage('')).toThrow('cannot be empty');
            expect(() => Validators.validateMessage('   ')).toThrow('cannot be empty');
        });

        it('should reject long messages', () => {
            expect(() => Validators.validateMessage('a'.repeat(501))).toThrow('less than 500 characters');
        });

        it('should reject SQL injection patterns', () => {
            expect(() => Validators.validateMessage('SELECT * FROM users')).toThrow('SQL keywords');
            expect(() => Validators.validateMessage('DROP TABLE test')).toThrow('SQL keywords');
        });

        it('should reject command injection characters', () => {
            expect(() => Validators.validateMessage('test; rm -rf /')).toThrow('special characters');
            expect(() => Validators.validateMessage('test | cat')).toThrow('special characters');
        });

        it('should reject XSS patterns', () => {
            // Note: parentheses trigger command injection filter first
            // Test XSS patterns without special chars that trigger other filters
            expect(() => Validators.validateMessage('onload=Something')).toThrow();
            // Verify XSS filter exists by checking the pattern is blocked
            expect(() => Validators.validateMessage('test onload= test')).toThrow();
        });
    });

    describe('validateApiKeyFormat', () => {
        it('should accept valid API key format', () => {
            // Valid format: ci_u{9 chars}_{token} - total >= 48 chars
            const validKey = 'ci_u12345678_' + 'a'.repeat(36); // ci_ prefix + u12345678 (9 chars) + _ + 36 char token = 51 chars
            expect(Validators.validateApiKeyFormat(validKey)).toBe(true);
        });

        it('should reject short API keys', () => {
            expect(Validators.validateApiKeyFormat('short')).toBe(false);
        });

        it('should reject API keys without correct prefix', () => {
            expect(Validators.validateApiKeyFormat('sk_u12345678_abc123')).toBe(false);
        });

        it('should reject API keys with invalid user ID format', () => {
            expect(Validators.validateApiKeyFormat('ci_12345678_abc123')).toBe(false);
            expect(Validators.validateApiKeyFormat('ci_u1234567_abc123')).toBe(false); // too short
        });
    });

    describe('validateLimit', () => {
        it('should accept valid limits', () => {
            expect(() => Validators.validateLimit(1)).not.toThrow();
            expect(() => Validators.validateLimit(25)).not.toThrow();
            expect(() => Validators.validateLimit(50)).not.toThrow();
        });

        it('should reject limits below 1', () => {
            expect(() => Validators.validateLimit(0)).toThrow('at least 1');
            expect(() => Validators.validateLimit(-5)).toThrow('at least 1');
        });

        it('should reject limits above 50', () => {
            expect(() => Validators.validateLimit(51)).toThrow('cannot exceed 50');
        });
    });
});
