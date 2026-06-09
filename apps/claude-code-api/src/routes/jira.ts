import { type Request, type Response,Router } from "express";

import { config } from "../config";
import { logger } from "../logger";
import { handleTicket } from "../services/runner";

export const jiraRouter = Router();

type JiraWebhookBody = {
  issue?: {
    key?: string;
    fields?: {
      summary?: string;
      description?: string | null;
    };
  };
};

jiraRouter.post("/", (req: Request, res: Response) => {
  const body = req.body as JiraWebhookBody;

  const key = body.issue?.key;
  const summary = body.issue?.fields?.summary;

  if (!key || !summary) {
    res.status(400).json({ success: false, error: "Missing issue.key or issue.fields.summary" });
    return;
  }

  const ticket = {
    key,
    summary,
    description: body.issue?.fields?.description ?? "",
  };

  logger.info("Received Jira webhook", { key, summary });

  handleTicket(ticket, config.REPO_DIR).catch((error: unknown) => {
    logger.error("Ticket processing failed", {
      key,
      error: error instanceof Error ? error.message : String(error),
    });
  });

  res.status(202).json({ success: true, message: `Processing ticket ${key}` });
});
