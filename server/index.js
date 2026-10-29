
import "dotenv/config";
import express from "express";
import cors from "cors";
import { fileURLToPath } from "node:url";
import aiRouter from "./routes/ai.js";

const app = express();
const port = Number(process.env.PORT) || 5000;

if (!process.env.GEMINI_API_KEY) {
  console.error("GEMINI_API_KEY is missing from server/.env");
  process.exit(1);
}

const allowedOrigins = (process.env.CLIENT_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({ origin: allowedOrigins }));

app.use(express.json({ limit: "100kb" }));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "StudyPilot API" });
});

app.use("/api/ai", aiRouter);

if (process.env.NODE_ENV === "production") {
  const clientDist = fileURLToPath(new URL("../client/dist/", import.meta.url));
  const clientIndex = fileURLToPath(new URL("../client/dist/index.html", import.meta.url));

  app.use(express.static(clientDist));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api/")) return next();
    res.sendFile(clientIndex);
  });
}

app.use("/api", (_req, res) => {
  res.status(404).json({ error: "API route not found." });
});

app.use((err, _req, res, _next) => {
  console.error("Server error:", err.message);
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ error: "Request body must contain valid JSON." });
  }
  res.status(500).json({ error: "An internal server error occurred." });
});

app.listen(port, () => {
  console.log(`StudyPilot API running on http://localhost:${port}`);
});
