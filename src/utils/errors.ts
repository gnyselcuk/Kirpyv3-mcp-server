// Custom error classes for better error handling

export class MCPError extends Error {
    constructor(
        message: string,
        public code: string,
        public statusCode: number = 500
    ) {
        super(message);
        this.name = 'MCPError';
    }
}

export class AuthenticationError extends MCPError {
    constructor(message: string = "Not authenticated") {
        super(message, "AUTH_ERROR", 401);
    }
}

export class ValidationError extends MCPError {
    constructor(message: string) {
        super(message, "VALIDATION_ERROR", 400);
    }
}

export class BackendAPIError extends MCPError {
    constructor(message: string, statusCode: number) {
        super(message, "BACKEND_ERROR", statusCode);
    }
}

export class NotFoundError extends MCPError {
    constructor(message: string) {
        super(message, "NOT_FOUND", 404);
    }
}
