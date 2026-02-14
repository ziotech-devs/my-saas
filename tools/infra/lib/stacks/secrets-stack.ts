import { Stack, type StackProps } from 'aws-cdk-lib';
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';
import type { Construct } from 'constructs';

export type SecretsStackProps = StackProps;

// Complete secret template matching .env.example
const SECRET_TEMPLATE = {
  // Environment
  NODE_ENV: 'production',

  // Ports
  PORT: '3000',

  // URLs
  PUBLIC_URL: '',
  STORAGE_URL: '',

  // Database (Prisma/PostgreSQL) - Docker Compose config
  POSTGRES_PORT: '5432',
  POSTGRES_DB: 'mysaas',
  POSTGRES_USER: 'postgres',
  POSTGRES_PASSWORD: 'postgres',

  // Database (Prisma/PostgreSQL) - Connection string
  DATABASE_URL: '',

  // Authentication Secrets
  ACCESS_TOKEN_SECRET: '',
  REFRESH_TOKEN_SECRET: '',

  // Chrome Browser (for printing)
  CHROME_PORT: '8080',
  CHROME_TOKEN: '',
  CHROME_URL: '',
  CHROME_IGNORE_HTTPS_ERRORS: '',

  // Mail Server
  MAIL_FROM: '',
  SMTP_URL: '',

  // Storage
  STORAGE_ENDPOINT: '',
  STORAGE_PORT: '9000',
  STORAGE_REGION: 'us-east-1',
  STORAGE_BUCKET: 'default',
  STORAGE_ACCESS_KEY: '',
  STORAGE_SECRET_KEY: '',
  STORAGE_USE_SSL: 'false',
  STORAGE_SKIP_BUCKET_CHECK: 'false',

  // Crowdin (Optional)
  CROWDIN_PROJECT_ID: '',
  CROWDIN_PERSONAL_TOKEN: '',

  // Feature Flags (Optional)
  DISABLE_SIGNUPS: 'false',
  DISABLE_EMAIL_AUTH: 'false',

  // GitHub OAuth (Optional)
  GITHUB_CLIENT_ID: '',
  GITHUB_CLIENT_SECRET: '',
  GITHUB_CALLBACK_URL: '',

  // Google OAuth (Optional)
  GOOGLE_CLIENT_ID: '32952416787-uci0i21eklq1p17vg499u6qfc8tbmfm4.apps.googleusercontent.com',
  GOOGLE_CLIENT_SECRET: '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',
  // GOOGLE_CALLBACK_URL: 'http://localhost:5173/api/auth/google/callback',
  
  // OpenID (Optional)
  VITE_OPENID_NAME: '',
  OPENID_AUTHORIZATION_URL: '',
  OPENID_CALLBACK_URL: '',
  OPENID_CLIENT_ID: '',
  OPENID_CLIENT_SECRET: '',
  OPENID_ISSUER: '',
  OPENID_SCOPE: 'openid profile email',
  OPENID_TOKEN_URL: '',
  OPENID_USER_INFO_URL: '',

  // OpenAI (Optional)
  OPENAI_API_KEY: '',

  // LangSmith (Optional)
  LANGSMITH_API_KEY: '',
  LANGSMITH_TRACING_V2: '',
  LANGSMITH_PROJECT: '',
  LANGSMITH_ENDPOINT: '',

  // Tavily (Optional)
  TAVILY_API_KEY: '',

  // Stripe
  STRIPE_PUBLISHABLE_KEY: '',
  STRIPE_SECRET_KEY: '',
  STRIPE_WEBHOOK_SECRET: '',
  STRIPE_BILLING_PORTAL_RETURN_URL: '',

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

export class SecretsStack extends Stack {
  public readonly appSecret: Secret;

  constructor(scope: Construct, id: string, props?: SecretsStackProps) {
    super(scope, id, props);

    // Application secrets - populate values in AWS Console after first deploy
    this.appSecret = new Secret(this, 'AppSecret', {
      secretName: 'my-saas/app-secrets',
      description: 'Application secrets for My SaaS - update values in AWS Console after deploy',
      generateSecretString: {
        secretStringTemplate: JSON.stringify(SECRET_TEMPLATE),
        generateStringKey: '_GENERATED_KEY',
      },
    });
  }
}
