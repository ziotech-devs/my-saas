import { z } from "zod";

const configSchema = z.object({
  NODE_ENV: z.enum(["development", "production"]).default("development"),
  CLAUDE_CODE_API_PORT: z.coerce.number().default(3001),
  // Absolute path to the repo root where Claude Code will run — defaults to cwd
  REPO_DIR: z.string().min(1).default(process.cwd()),
  // Optional HMAC secret for verifying Jira webhook signatures
  WEBHOOK_SECRET: z.string().optional(),
});

export type Config = z.infer<typeof configSchema>;

const parsed = configSchema.safeParse(process.env);

if (!parsed.success) {
  throw new Error(`Invalid environment variables: ${JSON.stringify(parsed.error.format())}`);
}

export const config: Config = parsed.data;
