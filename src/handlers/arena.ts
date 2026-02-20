import { ToolResponse, ArenaArgs, PostArenaArgs } from '../types/index.js';
import { BackendAPIClient } from '../utils/api-client.js';
import { handleToolError } from '../utils/error-handler.js';
import { Validators } from '../utils/validators.js';

export async function handleGetArenaMessages(apiKey: string, args: ArenaArgs): Promise<ToolResponse> {
    try {
        const limit = args.limit || 5;
        Validators.validateLimit(limit);

        const client = new BackendAPIClient(apiKey);
        const data = await client.getArenaMessages(limit);

        return {
            content: [{
                type: "text",
                text: JSON.stringify(data, null, 2)
            }]
        };
    } catch (error) {
        return handleToolError(error);
    }
}

export async function handlePostToArena(apiKey: string, args: PostArenaArgs): Promise<ToolResponse> {
    try {
        if (!args.message || args.message.trim() === '') {
            throw new Error("Message cannot be empty");
        }

        const client = new BackendAPIClient(apiKey);
        const data = await client.postToArena(args.message, args.sentiment || "neutral");

        return {
            content: [{
                type: "text",
                text: JSON.stringify(data, null, 2)
            }]
        };
    } catch (error) {
        return handleToolError(error);
    }
}
