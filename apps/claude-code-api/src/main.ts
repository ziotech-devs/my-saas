import express from "express";

import { config } from "./config";
import { logger } from "./logger";
import { jiraRouter } from "./routes/jira";

const app = express();

app.use(express.json());
app.use("/jira", jiraRouter);

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.listen(config.CLAUDE_CODE_API_PORT, () => {
  logger.info(`claude-code-api listening`, { port: config.CLAUDE_CODE_API_PORT, repoDir: config.REPO_DIR });
});
