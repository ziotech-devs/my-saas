import { tmpdir } from "node:os";
import path from "node:path";

import { logger } from "../logger";
import { addWorktree, removeWorktree as gitRemoveWorktree } from "./git";

export const createWorktree = (repoDir: string, branchName: string): string => {
  const safeName = branchName.replace(/\//g, "-");
  const worktreeDir = path.join(tmpdir(), `x-saas-${safeName}`);
  logger.info("Creating git worktree", { branchName, worktreeDir });
  addWorktree(repoDir, worktreeDir, branchName);
  return worktreeDir;
};

export const cleanupWorktree = (repoDir: string, worktreeDir: string): void => {
  try {
    logger.info("Removing git worktree", { worktreeDir });
    gitRemoveWorktree(repoDir, worktreeDir);
  } catch (error) {
    logger.warn("Failed to remove worktree — manual cleanup may be needed", {
      worktreeDir,
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
