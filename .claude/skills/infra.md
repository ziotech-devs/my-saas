---
description: AWS CDK infrastructure management for My SaaS - deploy, diff, synth, and destroy cloud resources
user-invocable: true
---

# CDK Infrastructure Skill

Manage AWS CDK infrastructure in `tools/aws-cdk/` for deploying the My SaaS application.

## Commands

```bash
# Synthesize CloudFormation templates (dry run)
pnpm cdk:synth

# Show diff between deployed and local
pnpm cdk:diff

# Deploy all stacks to AWS
pnpm cdk:deploy

# Destroy all stacks
pnpm cdk:destroy

# Build TypeScript
nx run infra:build
```

## Architecture

```
                         ┌─────────────┐
                         │ CloudFront  │
                         │   (CDN)     │
                         └──────┬──────┘
                                │
              ┌─────────────────┴─────────────────┐
              │ /*                                │ /api/*
              ▼                                   ▼
        ┌─────────┐                         ┌─────────┐
        │   S3    │                         │   ALB   │
        │  (SPA)  │                         │ :80/:8080│
        └─────────┘                         │  /:8123 │
                                            └────┬────┘
                                                 │
┌────────────────────────────────────────────────┼──────────────────┐
│                              VPC               │                  │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │              Public Subnets                                  │ │
│  │   ┌─────────────┐              ┌─────────────┐               │ │
│  │   │     ALB     │              │   NAT GW    │               │ │
│  │   └─────────────┘              └─────────────┘               │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                   Private Subnets                            │ │
│  │                                                              │ │
│  │   ┌─────────────────┐       ┌─────────────────────────────┐ │ │
│  │   │   ECS Fargate   │       │    ECS Fargate (LangGraph)  │ │ │
│  │   │  (NestJS API)   │       │    graphs / adminer tasks   │ │ │
│  │   └────────┬────────┘       └──────┬─────────────┬────────┘ │ │
│  │            │                       │             │           │ │
│  │   ┌────────▼────────┐   ┌──────────▼──┐   ┌─────▼────────┐ │ │
│  │   │   RDS (main)    │   │ RDS (graphs)│   │   Redis      │ │ │
│  │   │ PostgreSQL 16   │   │ PostgreSQL16 │   │ ElastiCache  │ │ │
│  │   │ db: mysaas      │   │ db: langgraph│   │ cache.t3.micro│ │ │
│  │   └─────────────────┘   └─────────────┘   └──────────────┘ │ │
│  └──────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              │                               │
        ┌─────────┐                    ┌─────────┐
        │   S3    │                    │   SES   │
        │(Uploads)│                    │ (Email) │
        └─────────┘                    └─────────┘
```

## Stacks

| Stack | File | Purpose | Dependencies |
|-------|------|---------|--------------|
| `MySaasEcrStack` | `ecr-stack.ts` | ECR container registry | none |
| `MySaasSecretsStack` | `secrets-stack.ts` | Secrets Manager template | none |
| `MySaasStorageStack` | `storage-stack.ts` | S3 bucket for file uploads | none |
| `MySaasNetworkStack` | `network-stack.ts` | VPC, subnets, security groups | none |
| `MySaasDatabaseStack` | `database-stack.ts` | RDS PostgreSQL t3.micro (db: `mysaas`) | Network |
| `MySaasGraphsDatabaseStack` | `graphs-database-stack.ts` | Dedicated RDS PostgreSQL t3.micro for LangGraph (db: `langgraph`) | Network |
| `MySaasCacheStack` | `cache-stack.ts` | ElastiCache Redis `cache.t3.micro` for LangGraph pub/sub | Network |
| `MySaasApiStack` | `api-stack.ts` | ECS Fargate + ALB (API, Adminer, LangGraph) | ECR, Secrets, Storage, Network, Database, GraphsDatabase, Cache |
| `MySaasFrontendStack` | `frontend-stack.ts` | S3 + CloudFront (SPA + `/api/*` → ALB) | ApiStack |

**Deploy order**: ECR/Secrets/Storage/Network → Database/GraphsDatabase/Cache (parallel) → API → Frontend. FrontendStack depends on ApiStack for the ALB DNS name.

## File Structure

```
tools/aws-cdk/
├── bin/
│   └── infra.ts                     # CDK app entry point
├── lib/
│   ├── stacks/
│   │   ├── network-stack.ts         # VPC, subnets, security groups
│   │   ├── database-stack.ts        # RDS PostgreSQL (main app)
│   │   ├── graphs-database-stack.ts # RDS PostgreSQL (LangGraph, db: langgraph)
│   │   ├── cache-stack.ts           # ElastiCache Redis (LangGraph pub/sub)
│   │   ├── storage-stack.ts         # S3 bucket for uploads
│   │   ├── frontend-stack.ts        # S3 + CloudFront for React SPA
│   │   └── api-stack.ts             # ECS Fargate, ALB (API + Adminer + LangGraph)
│   └── constructs/
│       └── fargate-service.ts       # Reusable Fargate construct
├── cdk.json                         # CDK configuration
├── tsconfig.json                    # TypeScript config
├── project.json                     # Nx project config
└── package.json                     # Dependencies
```

## Environment Variables

Set these before deploying:

```bash
export AWS_ACCOUNT_ID=123456789012
export AWS_REGION=us-east-1
# Or use AWS CLI profiles
export AWS_PROFILE=my-profile
```

## Key Resources Created

- **VPC**: 2 AZs, public/private subnets, NAT Gateway
- **RDS (main)**: PostgreSQL 16.4, t3.micro, db `mysaas`, 7-day backup retention
- **RDS (LangGraph)**: PostgreSQL 16.4, t3.micro, db `langgraph`, isolated to graphs security group
- **Redis**: ElastiCache `cache.t3.micro`, single node, isolated to graphs security group
- **S3**: Upload bucket with CORS, lifecycle rules
- **CloudFront**: HTTPS, SPA routing, caching
- **ECS**: Fargate services (API, Adminer, LangGraph), auto-scaling (API: 1-4 tasks), ALB health checks

## Common Tasks

### First-time deployment
```bash
# Bootstrap CDK (once per account/region)
cd tools/aws-cdk && npx cdk bootstrap

# Deploy all stacks
pnpm cdk:deploy
```

### Update infrastructure
```bash
# Preview changes
pnpm cdk:diff

# Apply changes
pnpm cdk:deploy
```

### Deploy frontend
```bash
# Build React app — graphs traffic is proxied through NestJS at /api/graphs
nx run client:build

# Sync to S3 (after CDK deploy)
aws s3 sync dist/apps/client s3://my-saas-frontend-ACCOUNT-REGION --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id DIST_ID --paths "/*"
```

## Account-Specific Values (us-east-1, account 301394200094)

| Resource | Value |
|----------|-------|
| RDS endpoint | `my-saas-db.c8bys2oog0hm.us-east-1.rds.amazonaws.com` |
| S3 uploads bucket | `my-saas-uploads-301394200094-us-east-1` |
| ECR repository | `my-saas-api` |
| ECS cluster | `my-saas-cluster` |
| ALB name | `my-saas-alb` |

## Secrets Management

Secrets in AWS Secrets Manager:
- `my-saas/database-credentials` — auto-generated by RDS for the main app DB (username, password, host, port)
- `my-saas/graphs-database-credentials` — auto-generated by RDS for LangGraph DB; **must add `DATABASE_URI` field manually** after first deploy (see below)
- `my-saas/app-secrets` — application config, **must be manually populated after first deploy**
- `my-saas/graphs-secrets` — LangGraph secrets (OPENAI_API_KEY, LANGSMITH_*, TAVILY_API_KEY)

### Populating `my-saas/graphs-database-credentials` after first deploy

LangGraph Platform reads `DATABASE_URI` from the ECS secret. The RDS-generated secret contains `username`/`password`/`host`/`port` but not `DATABASE_URI`. After deploying `MySaasGraphsDatabaseStack`, add the field:

```bash
# Get the auto-generated password
PASS=$(aws secretsmanager get-secret-value \
  --secret-id my-saas/graphs-database-credentials \
  --query SecretString --output text | python3 -c "import sys,json; print(json.load(sys.stdin)['password'])")

HOST=$(aws secretsmanager get-secret-value \
  --secret-id my-saas/graphs-database-credentials \
  --query SecretString --output text | python3 -c "import sys,json; print(json.load(sys.stdin)['host'])")

# Add DATABASE_URI to the secret
aws secretsmanager update-secret \
  --secret-id my-saas/graphs-database-credentials \
  --secret-string "{\"DATABASE_URI\":\"postgresql://postgres:${PASS}@${HOST}:5432/langgraph\"}"
```

Then force-redeploy the graphs ECS service to pick up the new secret value.

### Required app secrets for the server to start

The app validates config on startup via Zod schema (`apps/server/src/config/schema.ts`). Missing or invalid values crash the container, triggering the ECS circuit breaker. All fields marked **required** must be set — empty strings are accepted but invalid URLs or missing values for `.url()` fields will crash.

| Secret key | Type | Notes |
|------------|------|-------|
| `DATABASE_URL` | required URL | `postgresql://postgres:<pass>@<rds-endpoint>:5432/mysaas` |
| `ACCESS_TOKEN_SECRET` | required string | any random 32+ char value (`openssl rand -hex 32`) |
| `REFRESH_TOKEN_SECRET` | required string | any random 32+ char value |
| `PUBLIC_URL` | required URL | CloudFront URL (e.g. `https://xxx.cloudfront.net`) — NOT the ALB |
| `STORAGE_URL` | required URL | Public S3 URL: `https://<bucket>.s3.us-east-1.amazonaws.com` |
| `STORAGE_ENDPOINT` | required string | `s3.amazonaws.com` for AWS S3 |
| `STORAGE_PORT` | required number | `443` for S3 |
| `STORAGE_BUCKET` | required string | the S3 bucket name |
| `STORAGE_ACCESS_KEY` | required string | IAM user access key (see storage section below) |
| `STORAGE_SECRET_KEY` | required string | IAM user secret key |
| `GOOGLE_CALLBACK_URL` | optional URL | `https://<cloudfront>/api/auth/google/callback` — must match Google Console |
| `STORAGE_USE_SSL` | optional | `true` for S3 |
| `SMTP_URL` | optional URL | smtp:// or smtps:// — app starts without it |

### Storage IAM setup (important)

The app uses MinIO SDK which requires **explicit credentials** — it does NOT use the ECS task role automatically. Even though `uploadsBucket.grantReadWrite(apiTaskDef.taskRole)` is set in CDK, you still need a separate IAM user with S3 permissions:

```bash
# Create IAM user
aws iam create-user --user-name my-saas-s3-user

# Attach S3 policy
aws iam put-user-policy --user-name my-saas-s3-user --policy-name s3-access --policy-document '{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": ["s3:GetObject","s3:PutObject","s3:DeleteObject","s3:ListBucket","s3:GetBucketLocation"],
    "Resource": [
      "arn:aws:s3:::my-saas-uploads-301394200094-us-east-1",
      "arn:aws:s3:::my-saas-uploads-301394200094-us-east-1/*"
    ]
  }]
}'

# Create access keys, store in app-secrets
aws iam create-access-key --user-name my-saas-s3-user
```

## Troubleshooting

### CDK synth fails
```bash
nx run infra:build   # check TypeScript errors first
```

### Stack in ROLLBACK_COMPLETE state

A stack in `ROLLBACK_COMPLETE` cannot be updated — it must be deleted and redeployed:

```bash
# Check current stack states
aws cloudformation list-stacks --stack-status-filter ROLLBACK_COMPLETE --query 'StackSummaries[*].[StackName,StackStatus]' --output table

# Delete the failed stack (CDK will recreate it on next deploy)
aws cloudformation delete-stack --stack-name MySaasApiStack
aws cloudformation wait stack-delete-complete --stack-name MySaasApiStack

# Then redeploy
cd tools/aws-cdk && npx cdk deploy MySaasApiStack
```

**Most common cause**: ECS container crashes on startup (missing/invalid env vars) → circuit breaker triggers → stack rollback. Check what's missing in `my-saas/app-secrets` first.

### ECS Deployment Circuit Breaker triggered

This means containers started but failed health checks or crashed. Debug steps:

```bash
# 1. Check what caused the failure
aws cloudformation describe-stack-events --stack-name MySaasApiStack \
  --query 'StackEvents[?ResourceStatus==`CREATE_FAILED`].[LogicalResourceId,ResourceStatusReason]' \
  --output table

# 2. Check ECS task stopped reason
aws ecs describe-tasks --cluster my-saas-cluster \
  --tasks $(aws ecs list-tasks --cluster my-saas-cluster --desired-status STOPPED --query 'taskArns[0]' --output text) \
  --query 'tasks[0].containers[*].[name,reason,exitCode]' --output table

# 3. Check logs
aws logs tail /ecs/my-saas-api --follow
```

**Most common cause**: Zod config validation failure — empty strings for required `.url()` fields crash NestJS on boot. Check all required secrets listed above.

### Check which secrets are populated
```bash
aws secretsmanager get-secret-value --secret-id my-saas/app-secrets \
  --query SecretString --output text | \
  python3 -c "import sys,json; d=json.load(sys.stdin); print('\n'.join(f'{k}: {\"SET\" if v else \"EMPTY\"}' for k,v in d.items()))"
```

### Stack deployment fails (general)
```bash
aws cloudformation describe-stack-events --stack-name MySaasApiStack
```
