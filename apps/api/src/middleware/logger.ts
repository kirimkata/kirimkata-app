import { Context, Next } from 'hono';

/**
 * Request logging middleware
 * Logs request method, path, and timing
 */
export async function loggerMiddleware(c: Context, next: Next) {
    const start = Date.now();
    const method = c.req.method;
    const path = c.req.path;

    console.log(`→ ${method} ${path}`);

    await next();

    const duration = Date.now() - start;
    const status = c.res.status;

    console.log(`← ${method} ${path} ${status} (${duration}ms)`);
}
