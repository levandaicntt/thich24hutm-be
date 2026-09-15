const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const env = require("./config/env");
const { ok } = require("./utils/response");
const miniappRouter = require("./routes/miniapp");

const app = express();

app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN || true }));
app.use(express.json());

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

app.get("/health", (_req, res) => ok(res, { status: "ok" }));

app.use("/api/v1/miniapp", miniappRouter);

app.use((err, _req, res, _next) => {
  const status = err.status || 500;
  res.status(status).json({ error: -1, message: err.message || "Internal Server Error", data: null });
});

app.listen(env.PORT, () => {
  console.log(`Server running on port ${env.PORT}`);
});
