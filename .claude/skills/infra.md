---
description: AWS CDK infrastructure management for My SaaS - deploy, diff, synth, and destroy cloud resources
user-invocable: true
---

# CDK Infrastructure Skill

Manage AWS CDK infrastructure in `tools/infra/` for deploying the My SaaS application.

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
              ┌─────────────────┼─────────────────┐
              │                 │                 │
              ▼                 ▼                 │
        ┌─────────┐       ┌─────────┐            │
        │   S3    │       │   ALB   │            │
        │  (SPA)  │       │         │            │
        └─────────┘       └────┬────┘            │
                               │                 │
┌──────────────────────────────┼─────────────────┼───────────────┐
│                              │      VPC        │               │
│  ┌───────────────────────────┼─────────────────┼─────────────┐ │
│  │              Public Subnets                 │             │ │
│  │   ┌─────────────┐              ┌─────────────┐            │ │
│  │   │     ALB     │              │   NAT GW    │            │ │
│  │   └─────────────┘              └─────────────┘            │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                              │                                 │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                   Private Subnets                           │ │
│  │   ┌─────────────────┐              ┌─────────────┐          │ │
│  │   │   ECS Fargate   │              │     RDS     │          │ │
│  │   │  (NestJS API)   │──────────────│ PostgreSQL  │          │ │
│  │   └─────────────────┘              └─────────────┘          │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              │                               │
        ┌─────────┐                    ┌─────────┐
        │   S3    │                    │   SES   │
        │(Uploads)│                    │ (Email) │
        └─────────┘                    └─────────┘
```

## Stacks

| Stack | File | Purpose |
|-------|------|---------|
| `MySaasNetworkStack` | `network-stack.ts` | VPC, subnets, security groups |
| `MySaasDatabaseStack` | `database-stack.ts` | RDS PostgreSQL (t3.micro) |
| `MySaasStorageStack` | `storage-stack.ts` | S3 bucket for file uploads |
| `MySaasFrontendStack` | `frontend-stack.ts` | S3 + CloudFront for React SPA |
| `MySaasApiStack` | `api-stack.ts` | ECS Fargate + ALB for NestJS |

## File Structure

```
tools/infra/
├── bin/
│   └── infra.ts              # CDK app entry point
├── lib/
│   ├── stacks/
│   │   ├── network-stack.ts  # VPC, subnets, security groups
│   │   ├── database-stack.ts # RDS PostgreSQL
│   │   ├── storage-stack.ts  # S3 bucket for uploads
│   │   ├── frontend-stack.ts # S3 + CloudFront for React SPA
│   │   └── api-stack.ts      # ECS Fargate, ALB for NestJS
│   └── constructs/
│       └── fargate-service.ts # Reusable Fargate construct
├── cdk.json                  # CDK configuration
├── tsconfig.json             # TypeScript config
├── project.json              # Nx project config
└── package.json              # Dependencies
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

- **VPC**: 1 AZ, public/private subnets, NAT Gateway
- **RDS**: PostgreSQL 16.4, t3.micro, 7-day backup retention
- **S3**: Upload bucket with CORS, lifecycle rules
- **CloudFront**: HTTPS, SPA routing, caching
- **ECS**: Fargate service, auto-scaling (1-4 tasks), ALB health checks

## Common Tasks

### First-time deployment
```bash
# Bootstrap CDK (once per account/region)
cd tools/infra && npx cdk bootstrap

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
# Build React app
nx run client:build

# Sync to S3 (after CDK deploy)
aws s3 sync dist/apps/client s3://my-saas-frontend-ACCOUNT-REGION --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id DIST_ID --paths "/*"
```

## Secrets Management

Database credentials are auto-generated and stored in AWS Secrets Manager:
- Secret name: `my-saas/database-credentials`
- Contains: `username`, `password`, `host`, `port`, `dbname`

## Troubleshooting

### CDK synth fails
```bash
# Check TypeScript errors
nx run infra:build
```

### Stack deployment fails
```bash
# Check CloudFormation events in AWS Console
# Or use AWS CLI:
aws cloudformation describe-stack-events --stack-name MySaasApiStack
```

### ECS service not starting
```bash
# Check ECS task logs
aws logs tail /ecs/my-saas-api --follow
```
