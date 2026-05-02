import express, { type Express } from "express";
import cors from "cors";
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

export default app;
