---
id: cloud
title: Cloud (AWS)
---

# Cloud Deployment (AWS)

Deployed on AWS us-east-1 using ECS (API + graphs), S3 + CloudFront (frontend), and RDS (PostgreSQL).

## CI/CD Pipeline

Deployment is automated via GitHub Actions (`.github/workflows/deploy-aws.yml`).

**Trigger:** manual `workflow_dispatch` only.

**Pipeline:**

```
workflow_dispatch
    │
    ▼
Test & Build (pnpm test + pnpm build)
    │
    ├──▶ Deploy API      → Docker image → ECR → ECS force redeploy
    ├──▶ Deploy Frontend → nx client:build → S3 sync → CloudFront invalidation
    └──▶ Deploy Graphs   → langgraph build → ECR → ECS force redeploy (skipped if service not active)
```

All three deploys run in parallel after tests pass.

## Required GitHub Secrets

| Secret | Description |
|---|---|
| `AWS_ACCESS_KEY_ID` | IAM credentials |
| `AWS_SECRET_ACCESS_KEY` | IAM credentials |
| `CLOUDFRONT_DISTRIBUTION_ID` | CloudFront distribution to invalidate |
| `NX_CLOUD_ACCESS_TOKEN` | Nx Cloud token (optional, for build cache) |

## Manual Deploy

### Frontend

```bash
pnpm exec nx run client:build
aws s3 sync dist/apps/client s3://my-saas-frontend-301394200094-us-east-1 --delete
aws cloudfront create-invalidation --distribution-id $CLOUDFRONT_DISTRIBUTION_ID --paths "/*"
```

### API

```bash
docker build -t my-saas-api:latest .
docker tag my-saas-api:latest 301394200094.dkr.ecr.us-east-1.amazonaws.com/my-saas-api:latest
docker push 301394200094.dkr.ecr.us-east-1.amazonaws.com/my-saas-api:latest
aws ecs update-service --cluster my-saas-cluster --service my-saas-api --force-new-deployment
```

### AI Graphs Service

```bash
cd apps/graphs
langgraph build -t my-saas-graphs:latest
docker tag my-saas-graphs:latest 301394200094.dkr.ecr.us-east-1.amazonaws.com/my-saas-graphs:latest
docker push 301394200094.dkr.ecr.us-east-1.amazonaws.com/my-saas-graphs:latest
aws ecs update-service --cluster my-saas-cluster --service my-saas-graphs --force-new-deployment
```

## Infrastructure Resources

| Resource | Description |
|---|---|
| ECS Cluster (`my-saas-cluster`) | Runs API and graphs services |
| RDS (PostgreSQL) | Main database |
| S3 (`my-saas-frontend-*`) | Static frontend assets |
| CloudFront | CDN for frontend |
| S3 (uploads) | User file uploads |
| ECR (`my-saas-api`) | Docker image registry for API |
| ECR (`my-saas-graphs`) | Docker image registry for graphs |
| ALB | Load balancer for API and Adminer |
