import { logger } from "../logger";
import {buildImplementationPrompt } from "../prompts/ticket.prompts";
import { runImplementation, warmClaudeCode } from "./claude-code";
import { commitAndPush, createPullRequest, pullOrigin } from "./git";
import { cleanupWorktree,createWorktree } from "./worktree";

type Ticket = {
  key: string;
  summary: string;
  description: string;
};

export const handleTicket = async (ticket: Ticket, repoDir: string): Promise<void> => {
  const branchName = `ticket/${ticket.key.toLowerCase()}`;
  logger.info("Processing ticket", { key: ticket.key, branch: branchName });

  try {
    pullOrigin(repoDir);
  } catch (error: unknown) {
    logger.warn("git pull failed, continuing on current state", {
      error: error instanceof Error ? error.message : String(error),
    });
  }

  const worktreeDir = createWorktree(repoDir, branchName);

  try {
    const warm = await warmClaudeCode(worktreeDir);

    const implementationPrompt = buildImplementationPrompt(ticket);
    const { sessionId: _sessionId } = await runImplementation(worktreeDir, implementationPrompt, warm ?? undefined);

    // const reviewResult = await runCodeReview(worktreeDir, ticket.key);
    // logger.info("Code review result", { ticketKey: ticket.key, hasIssues: reviewResult.hasIssues });

    // if (reviewResult.hasIssues) {
    //   logger.info("Applying review fixes", { ticketKey: ticket.key, sessionId });
    //   await runImplementation(worktreeDir, buildFixPrompt(ticket.key, reviewResult.findings), undefined, sessionId);
    // }

    const commitMessage = `feat: ${ticket.key} - ${ticket.summary}`;
    commitAndPush(worktreeDir, commitMessage, branchName);

    const prUrl = createPullRequest(worktreeDir, commitMessage, `Resolves ${ticket.key}\n\n${ticket.summary}`);
    logger.info("Ticket processing complete", { key: ticket.key, branch: branchName, prUrl });
  } finally {
    cleanupWorktree(repoDir, worktreeDir);
  }
};
