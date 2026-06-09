import { mkdirSync,writeFileSync } from "node:fs";
import path from "node:path";

import { query, startup, type WarmQuery } from "@anthropic-ai/claude-agent-sdk";

import { logger } from "../logger";
import { buildReviewPrompt } from "../prompts/ticket.prompts";
import { type Ticket } from "../types";

const LOGS_DIR = path.join(process.cwd(), "logs", "runs");

const writeRunLog = (sessionId: string, messages: unknown[]) => {
  mkdirSync(LOGS_DIR, { recursive: true });
  const filename = path.join(LOGS_DIR, `${sessionId}.json`);
  writeFileSync(filename, JSON.stringify(messages, null, 2));
  logger.info("Run log written", { path: filename });
};

export const warmClaudeCode = async (repoDir: string): Promise<WarmQuery | null> => {
  logger.info("Pre-warming implementation agent", { repoDir });
  try {
    return await startup({
      options: { cwd: repoDir, maxTurns: 50, permissionMode: "acceptEdits" },
    });
  } catch (error) {
    logger.error("Failed to pre-warm Claude Code agent", { error });
    return null;
  }
};

type QueryResult = {
  result: string;
  sessionId: string;
};

export const runImplementation = async (
  repoDir: string,
  prompt: string,
  warm?: WarmQuery,
  resumeSessionId?: string
): Promise<QueryResult> => {
  logger.info("Starting Claude implementation session", {
    repoDir,
    preWarmed: !!warm,
    resuming: !!resumeSessionId,
  });

  const messages =
    warm
      ? warm.query(prompt)
      : query({
          prompt,
          options: {
            cwd: repoDir,
            maxTurns: 50,
            permissionMode: "acceptEdits",
            resume: resumeSessionId,
            abortController: new AbortController(),
          },
        });

  let result = "";
  let sessionId = "";
  const runMessages: unknown[] = [];

  for await (const message of messages) {
    runMessages.push(message);

    if (message.type === "result") {
      sessionId = message.session_id;
      logger.info("Claude implementation complete", {
        subtype: message.subtype,
        sessionId,
        numTurns: message.num_turns,
      });
      if (message.subtype === "success") {
        result = message.result;
        logger.info("Implementation cost", { totalCostUsd: message.total_cost_usd });
      }
      writeRunLog(sessionId, runMessages);
    }
  }

  return { result, sessionId };
};

type ReviewResult = {
  hasIssues: boolean;
  findings: string;
};

export const runCodeReview = async (repoDir: string, ticket: Ticket): Promise<ReviewResult> => {
  logger.info("Starting Claude code review session", { repoDir, ticketKey: ticket.key });

  const prompt = buildReviewPrompt(ticket);

  const messages = query({
    prompt,
    options: {
      cwd: repoDir,
      maxTurns: 10,
      permissionMode: "bypassPermissions",
      abortController: new AbortController(),
    },
  });

  let raw = "";
  const runMessages: unknown[] = [];

  for await (const message of messages) {
    runMessages.push(message);

    if (message.type === "result") {
      logger.info("Claude code review complete", {
        subtype: message.subtype,
        sessionId: message.session_id,
        numTurns: message.num_turns,
      });
      if (message.subtype === "success") {
        raw = message.result;
        logger.info("Review cost", { totalCostUsd: message.total_cost_usd });
      }
      writeRunLog(message.session_id, runMessages);
    }
  }

  const hasIssues = /has_issues:\s*true/i.test(raw);
  const findingsMatch = /findings:\s*([\S\s]*)/i.exec(raw);
  const findings = findingsMatch ? findingsMatch[1].trim() : raw;

  return { hasIssues, findings };
};
