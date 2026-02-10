import { Context } from 'hono';

interface RateLimitConfig {
    windowMs: number;
    max: number;
    message?: string;
    keyGenerator?: (c: Context) => string;
}

interface ClientRateLimit {
    count: number;
    resetTime: number;
}

export class RateLimiter {
    private requests: Map<string, ClientRateLimit>;
    private config: RateLimitConfig;

    constructor(config: RateLimitConfig) {
        this.requests = new Map();
        this.config = {
            message: 'Too many requests, please try again later.',
            keyGenerator: (c) => {
                const forwarded = c.req.header('x-forwarded-for');
                const realIp = c.req.header('x-real-ip');
                return forwarded?.split(',')[0] || realIp || 'unknown';
            },
            ...config,
        };

    }

    middleware() {
        return async (c: Context, next: () => Promise<void>) => {
            const now = Date.now();
            const key = this.config.keyGenerator!(c);

            let clientLimit = this.requests.get(key);

            if (!clientLimit || now > clientLimit.resetTime) {
                clientLimit = {
                    count: 0,
                    resetTime: now + this.config.windowMs,
                };
                this.requests.set(key, clientLimit);
            }

            clientLimit.count++;

            if (clientLimit.count > this.config.max) {
                return c.json(
                    { success: false, error: this.config.message },
                    429
                );
            }

            await next();
        };
    }
}
