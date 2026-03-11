import { RemovalPolicy, Stack, type StackProps } from 'aws-cdk-lib';
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';
import type { Construct } from 'constructs';

export type SecretsStackProps = StackProps;

// Secret template with placeholder values that pass Zod validation on first boot.
// Fields marked REPLACE must be updated in AWS Console before the app works correctly.
const SECRET_TEMPLATE = {
  // Environment
  NODE_ENV: 'production',

  // Ports
  PORT: '3000',

  // URLs — REPLACE with actual values after deploy
  PUBLIC_URL: 'http://placeholder.example.com',   // REPLACE: ALB DNS after deploy
  STORAGE_URL: 'http://placeholder.example.com',  // REPLACE: https://<bucket>.s3.<region>.amazonaws.com

  // Database (Prisma/PostgreSQL) - Docker Compose config
  POSTGRES_PORT: '5432',
  POSTGRES_DB: 'mysaas',
  POSTGRES_USER: 'postgres',
  POSTGRES_PASSWORD: 'postgres',

  // Database (Prisma/PostgreSQL) - Connection string — REPLACE
  DATABASE_URL: 'postgresql://user:password@localhost:5432/mysaas',

  // Authentication Secrets — REPLACE with `openssl rand -hex 32`
  ACCESS_TOKEN_SECRET: 'replace-with-random-secret',
  REFRESH_TOKEN_SECRET: 'replace-with-random-secret',

  // Mail Server — placeholders pass validation; REPLACE with real SMTP to send email
  MAIL_FROM: 'noreply@example.com',
  SMTP_URL: 'smtp://localhost:25',

  // Storage — REPLACE with actual S3/MinIO credentials
  STORAGE_ENDPOINT: 's3.amazonaws.com',
  STORAGE_PORT: '443',
  STORAGE_REGION: 'us-east-1',
  STORAGE_BUCKET: 'replace-with-bucket-name',
  STORAGE_ACCESS_KEY: 'replace-with-access-key',
  STORAGE_SECRET_KEY: 'replace-with-secret-key',
  STORAGE_USE_SSL: 'true',
  STORAGE_SKIP_BUCKET_CHECK: 'false',

  // Crowdin (Optional)
  CROWDIN_PROJECT_ID: '',
  CROWDIN_PERSONAL_TOKEN: '',

  // Feature Flags (Optional)
  DISABLE_SIGNUPS: 'false',
  DISABLE_EMAIL_AUTH: 'false',

  // GitHub OAuth (Optional) — placeholders allow app to start; REPLACE to enable GitHub login
  GITHUB_CLIENT_ID: '',
  GITHUB_CLIENT_SECRET: '',
  GITHUB_CALLBACK_URL: 'http://placeholder.example.com',

  // Google OAuth (Optional) — placeholders allow app to start; REPLACE to enable Google login
  GOOGLE_CLIENT_ID: '',
  GOOGLE_CLIENT_SECRET: '',
  GOOGLE_CALLBACK_URL: 'http://placeholder.example.com',

  // OpenID (Optional) — placeholders allow app to start; REPLACE to enable OpenID login
  VITE_OPENID_NAME: '',
  OPENID_AUTHORIZATION_URL: 'http://placeholder.example.com',
  OPENID_CALLBACK_URL: 'http://placeholder.example.com',
  OPENID_CLIENT_ID: '',
  OPENID_CLIENT_SECRET: '',
  OPENID_ISSUER: '',
  OPENID_SCOPE: 'openid profile email',
  OPENID_TOKEN_URL: 'http://placeholder.example.com',
  OPENID_USER_INFO_URL: 'http://placeholder.example.com',

  // Stripe (Optional) — placeholder allows app to start; REPLACE to enable billing
  STRIPE_PUBLISHABLE_KEY: '',
  STRIPE_SECRET_KEY: '',
  STRIPE_WEBHOOK_SECRET: '',
  STRIPE_BILLING_PORTAL_RETURN_URL: 'http://placeholder.example.com',

  // Anthropic (Optional)
  ANTHROPIC_API_KEY: '',

  // AWS
  AWS_ACCOUNT_ID: '',
  AWS_REGION: 'us-east-1',
  AWS_PROFILE: '',
  AWS_ACCESS_KEY_ID: '',
  AWS_SECRET_ACCESS_KEY: '',
  AWS_SESSION_TOKEN: '',
};

const GRAPHS_SECRET_TEMPLATE = {
  // OpenAI
  OPENAI_API_KEY: '',

  // LangSmith
  LANGSMITH_API_KEY: '',
  LANGSMITH_TRACING_V2: 'true',
  LANGSMITH_PROJECT: '',
  LANGSMITH_ENDPOINT: 'https://api.smith.langchain.com',

  // Tavily
  TAVILY_API_KEY: '',
};

export class SecretsStack extends Stack {
  public readonly appSecret: Secret;
  public readonly graphsSecret: Secret;

  constructor(scope: Construct, id: string, props?: SecretsStackProps) {
    super(scope, id, props);

    // CDK only creates the secret resource — it never manages the value.
    // Populate manually after first deploy. Future CDK deploys won't touch the value.
    this.appSecret = new Secret(this, 'AppSecret', {
      secretName: 'my-saas/app-secrets',
      description: 'Application secrets for My SaaS - populate via bootstrap script after first deploy',
      removalPolicy: RemovalPolicy.RETAIN,
    });

    this.graphsSecret = new Secret(this, 'GraphsSecret', {
      secretName: 'my-saas/graphs-secrets',
      description: 'LangGraph service secrets - populate via bootstrap script after first deploy',
      removalPolicy: RemovalPolicy.RETAIN,
    });
  }
}
