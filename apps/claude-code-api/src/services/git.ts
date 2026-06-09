import { execSync } from "node:child_process";

import { logger } from "../logger";

const exec = (cmd: string, cwd: string): string => {
  logger.info(`git: ${cmd}`, { cwd });
  return execSync(cmd, { cwd, encoding: "utf8" }).trim();
};

const getRemoteName = (repoDir: string): string | null => {
  try {
    const remotes = exec("git remote", repoDir).split("\n").filter(Boolean);
    if (remotes.length === 0) return null;
    return remotes.includes("origin") ? "origin" : remotes[0];
  } catch {
    return null;
  }
};

export const pullOrigin = (repoDir: string): void => {
  const remote = getRemoteName(repoDir);
  if (!remote) {
    logger.warn("git pull skipped: no remotes found", { repoDir });
    return;
  }
  const branch = exec("git rev-parse --abbrev-ref HEAD", repoDir);
  exec(`git pull ${remote} ${branch}`, repoDir);
};

const branchExists = (repoDir: string, branchName: string): boolean => {
  try {
    exec(`git rev-parse --verify refs/heads/${branchName}`, repoDir);
    return true;
  } catch {
    return false;
  }
};

const worktreeExists = (repoDir: string, worktreeDir: string): boolean => {
  try {
    const list = exec("git worktree list --porcelain", repoDir);
    return list.includes(worktreeDir);
  } catch {
    return false;
  }
};

export const addWorktree = (repoDir: string, worktreeDir: string, branchName: string): void => {
  if (worktreeExists(repoDir, worktreeDir)) {
    throw new Error(`Worktree "${worktreeDir}" already exists`);
  }
  exec(`git worktree add ${worktreeDir} -b ${branchName}`, repoDir);
};

export const removeWorktree = (repoDir: string, worktreeDir: string): void => {
  exec(`git worktree remove ${worktreeDir} --force`, repoDir);
};

export const createBranch = (repoDir: string, branchName: string): void => {
  if (branchExists(repoDir, branchName)) {
    throw new Error(`Branch "${branchName}" already exists`);
  }
  exec(`git checkout -B ${branchName}`, repoDir);
};

export const commitAndPush = (repoDir: string, message: string, branch: string): void => {
  const remote = getRemoteName(repoDir);
  if (!remote) throw new Error("Cannot push: no remotes configured");
  exec("git add -A", repoDir);
  exec(`git commit -m "${message.replace(/"/g, String.raw`\"`)}"`, repoDir);
  exec(`git push -u ${remote} ${branch}`, repoDir);
};

type LintResult = {
  ok: boolean;
  output: string;
};

export const runTests = (repoDir: string): LintResult => {
  try {
    const output = exec("pnpm test --run", repoDir);
    return { ok: true, output };
  } catch (error: unknown) {
    const output = error instanceof Error ? error.message : String(error);
    return { ok: false, output };
  }
};

export const runLint = (repoDir: string): LintResult => {
  try {
    const output = exec("pnpm lint", repoDir);
    return { ok: true, output };
  } catch (error: unknown) {
    const output = error instanceof Error ? error.message : String(error);
    return { ok: false, output };
  }
};

export const createPullRequest = (repoDir: string, title: string, body: string): string => {
  const url = exec(
    `gh pr create --title "${title.replace(/"/g, String.raw`\"`)}" --body "${body.replace(/"/g, String.raw`\"`)}" --base main`,
    repoDir,
  );
  return url;
};
