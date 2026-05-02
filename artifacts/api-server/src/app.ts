import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

// Security headers — applied before CORS so they cover all responses
app.use(
  helmet({
    // Allow iframe embedding only from same origin (no admin dashboard, no cross-origin embeds needed)
    frameguard: { action: "sameorigin" },
    // Content-Security-Policy is handled by the frontend CDN; relax it here to avoid false positives
    contentSecurityPolicy: false,
    // Keep all other helmet defaults: X-Content-Type-Options, X-XSS-Protection,
    // Strict-Transport-Security, X-DNS-Prefetch-Control, Referrer-Policy, etc.
  }),
);

const allowedOrigins = (() => {
  const envOrigin = process.env["PUBLIC_APP_ORIGIN"];
  const origins: string[] = ["http://localhost", "http://localhost:3000", "http://localhost:5173"];
  if (envOrigin) {
    origins.push(...envOrigin.split(",").map((o) => o.trim()).filter(Boolean));
  }
  return origins;
})();

app.use(
  cors({
    origin(origin, callback) {
      // Allow same-origin / non-browser requests (no Origin header) and dev tools
      if (!origin) return callback(null, true);
      if (
        allowedOrigins.some((o) => origin === o || origin.startsWith("http://localhost")) ||
        origin.endsWith(".replit.dev") ||
        origin.endsWith(".replit.app")
      ) {
        return callback(null, true);
      }
      return callback(new Error("CORS: origin not allowed"), false);
    },
    credentials: true,
  })
);

// 100 kb hard cap — the API accepts only fingerprints and metadata, never files or base64
app.use(express.json({ limit: "100kb" }));
// urlencoded not needed for a JSON-only API; omitting it removes a potential attack surface

app.use("/api", router);

// ── Global error handler ──────────────────────────────────────────────────────
// Catches any error thrown or passed to next() in route handlers.
// Never leaks stack traces to clients; always logs server-side.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
  const status = (err as { status?: number; statusCode?: number })?.status ??
    (err as { status?: number; statusCode?: number })?.statusCode ?? 500;
  const message =
    status < 500
      ? (err as { message?: string })?.message ?? "Bad request"
      : "Internal server error";

  req.log?.error({ err }, "Unhandled error");
  if (!res.headersSent) {
    res.status(status).json({ error: message });
  }
});

export default app;
