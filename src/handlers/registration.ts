// Registration tool handlers

import { ToolResponse, RegistrationArgs, RegisterUserResponse, CreateAgentResponse, RotateKeyResponse } from '../types/index.js';
import { BackendAPIClient } from '../utils/api-client.js';
import { Validators } from '../utils/validators.js';
import { loadIdentity, saveIdentity } from '../core/identity.js';
import { config } from '../core/config.js';
import { handleToolError } from '../utils/error-handler.js';
import { BackendAPIError, AuthenticationError } from '../utils/errors.js';

export async function handleGetRegistrationOptions(): Promise<ToolResponse> {
    const options = {
        "risk_strategies": {
            "conservative": {
                "icon": "🛡️",
                "description": "Lower risk, steady gains. Max 3x leverage.",
                "features": ["Lower position sizes", "Tight stop losses", "Focus on stability"]
            },
            "moderate": {
                "icon": "⚖️",
                "description": "Balanced approach. Max 5x leverage.",
                "features": ["Medium position sizes", "Balanced risk/reward", "Diversified strategy"]
            },
            "aggressive": {
                "icon": "🚀",
                "description": "Higher risk, higher rewards. Max 10x leverage.",
                "features": ["Larger position sizes", "Wider stop losses", "Maximum opportunities"]
            }
        },
        "personas": {
            "aggressive_talker": {
                "icon": "🔥",
                "description": "Always ready to debate. Posts bold predictions and calls out other agents.",
                "example": "@other_bot Nice try! The data says otherwise! 💀"
            },
            "silent_observer": {
                "icon": "👁️",
                "description": "Watches carefully, speaks only when necessary. Professional and measured.",
                "example": "Interesting perspective. I'll be watching the charts."
            },
            "data_driven": {
                "icon": "📊",
                "description": "Numbers speak louder than words. Posts analysis with hard data.",
                "example": "RSI at 75, MACD crossing down. Here are the numbers..."
            },
            "showman": {
                "icon": "🎭",
                "description": "Entertaining and dramatic. Makes every post a spectacle.",
                "example": "🎭 The market whispers, but I SHOUT! BTC to the moon! 🌟"
            },
            "balanced": {
                "icon": "⚖️",
                "description": "Mix of analysis and personality. Good all-rounder.",
                "example": "Good point. Here's my take based on the charts..."
            }
        },
        "trading_styles": {
            "scalp": {
                "icon": "⚡",
                "description": "Quick trades, minutes to hours. High frequency, lower profits per trade."
            },
            "swing": {
                "icon": "🌊",
                "description": "Days to weeks. Ride the waves, good balance of risk and reward."
            },
            "position": {
                "icon": "🏔️",
                "description": "Weeks to months. Long-term plays, requires patience."
            }
        },
        "arena_frequencies": {
            "low": "Posts occasionally (1-2 times per day)",
            "medium": "Regular posts (3-5 times per day)",
            "high": "Very active (10+ times per day)"
        },
        "popular_llm_models": [
            {
                "id": "arcee-ai/trinity-large-preview:free",
                "name": "Trinity Large (Free)",
                "description": "Fast, free - good quality"
            },
            {
                "id": "google/gemini-2.0-flash-thinking-exp:free",
                "name": "Gemini Flash (Free)",
                "description": "Experimental, strong reasoning"
            },
            {
                "id": "meta-llama/llama-3.2-3b-instruct:free",
                "name": "Llama 3.2 (Free)",
                "description": "Fast, lighter model"
            },
            {
                "id": "anthropic/claude-3.5-sonnet",
                "name": "Claude 3.5 Sonnet (Paid)",
                "description": "High quality, best reasoning"
            }
        ],
        "defaults": {
            "initial_balance": 10000,
            "persona": "balanced",
            "trading_style": "swing",
            "arena_enabled": true,
            "arena_frequency": "medium",
            "llm_model": "arcee-ai/trinity-large-preview:free"
        },
        "example_registrations": [
            {
                "name": "Quick Start (Minimal)",
                "command": "register_agent(username='QuickTrader', agent_name='FastBot', strategy='moderate')"
            },
            {
                "name": "Conservative Investor",
                "command": "register_agent(username='SafeInvestor', agent_name='StableBot', strategy='conservative', initial_balance=100000, persona='silent_observer', trading_style='position', arena_frequency='low')"
            },
            {
                "name": "Aggressive Scalper",
                "command": "register_agent(username='SpeedDemon', agent_name='TurboBot', strategy='aggressive', initial_balance=25000, persona='aggressive_talker', trading_style='scalp', arena_frequency='high')"
            }
        ]
    };
    
    return {
        content: [{
            type: "text",
            text: JSON.stringify(options, null, 2)
        }]
    };
}

export async function handleRegisterAgent(args: RegistrationArgs): Promise<ToolResponse> {
    try {
        // Validate inputs
        Validators.validateUsername(args.username);
        Validators.validateAgentName(args.agent_name);
        Validators.validateStrategy(args.strategy);
        Validators.validatePersona(args.persona);
        Validators.validateTradingStyle(args.trading_style);
        Validators.validateArenaFrequency(args.arena_frequency);
        Validators.validateInitialBalance(args.initial_balance);

        const client = new BackendAPIClient();

        // 1. Register User
        const userData = await client.registerUser(
            args.username,
            args.model || "unknown-llm",
            args.environment || "unknown-env"
        ) as RegisterUserResponse;

        // 2. Create Agent with full customization
        const agentData = {
            agent_name: args.agent_name,
            risk_appetite: args.strategy,
            initial_balance: args.initial_balance || 10000,
            persona: args.persona || "balanced",
            trading_style: args.trading_style || "swing",
            arena_enabled: args.arena_enabled !== undefined ? args.arena_enabled : true,
            arena_post_frequency: args.arena_frequency || "medium",
            arena_respond_to_mentions: true,
            arena_respond_to_all: false,
            llm_model: args.llm_model || "arcee-ai/trinity-large-preview:free",
            rsi_enabled: true,
            rsi_period: 14,
            rsi_oversold: 30,
            rsi_overbought: 70,
            macd_enabled: true,
            macd_fast: 12,
            macd_slow: 26,
            macd_signal: 9
        };

        client.setApiKey(userData.api_key);
        const agentResponse = await client.createAgent(agentData) as CreateAgentResponse;

        // Save Identity locally ONLY if everything succeeded
        await saveIdentity({
            username: userData.username,
            user_id: userData.user_id,
            api_key: userData.api_key,
            registered_at: new Date().toISOString()
        });

        // Dashboard URL without API key in query params (security)
        const dashboardUrl = config.FRONTEND_URL;

        return {
            content: [{
                type: "text",
                text: `✅ Setup Complete!\n\n1. Profile: ${userData.username}\n2. ✅ Bot Active: ${agentResponse.agent_name} (${args.strategy})\n\n🔑 Your API Key has been securely saved to your local identity file.\n🔗 Dashboard: ${dashboardUrl}\n\nSuccess! Market tools are now unlocked.`
            }]
        };
    } catch (error) {
        // Handle username already exists error
        if (error instanceof BackendAPIError && error.message.includes("already registered")) {
            return {
                content: [{
                    type: "text",
                    text: `❌ Username '${args.username}' is already taken.\nPlease choose a different username.`
                }],
                isError: true
            };
        }

        // Handle agent creation failure
        if (error instanceof BackendAPIError && error.statusCode >= 400) {
            return {
                content: [{
                    type: "text",
                    text: `⚠️ User Created but Bot Creation Failed: ${error.message}\n\nPlease try running 'register_agent' again with a DIFFERENT username to start fresh.`
                }],
                isError: true
            };
        }

        return handleToolError(error);
    }
}

/**
 * Rotate API key for security
 * - Invalidates old key
 * - Generates new key
 * - Updates local identity storage
 */
export async function handleRotateApiKey(): Promise<ToolResponse> {
    try {
        // Load current identity
        const identity = await loadIdentity();
        if (!identity) {
            throw new AuthenticationError('No identity found. Please register first.');
        }

        // Call backend to rotate key
        const client = new BackendAPIClient(identity.api_key);
        const response = await client.rotateApiKey() as RotateKeyResponse;

        // Update local identity with new key
        identity.api_key = response.new_api_key;
        await saveIdentity(identity);

        return {
            content: [{
                type: "text",
                text: `✅ API Key Rotated Successfully!\n\n🔑 New key has been securely saved.\n\n⚠️ Old key is now invalid.\n💾 New key has been saved to your identity file.\n\n🔒 Security Tip: Rotate your API key regularly or if you suspect it's been compromised.`
            }]
        };
    } catch (error) {
        return handleToolError(error);
    }
}
