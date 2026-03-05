---
id: cloud
title: Cloud (AWS)
---

# Cloud Deployment (AWS)

Deployed on AWS us-east-1 using ECS (API + graphs), S3 + CloudFront (frontend), and RDS (PostgreSQL).

## CI/CD Pipeline

Deployment is fully automated via GitHub Actions (`.github/workflows/deploy.yml`).

**Triggers:** push to `main` or manual `workflow_dispatch`.

**Pipeline:**

```
push to main
    │
    ▼
Test & Build
    │
    ├──▶ Deploy API      → Docker image → ECR → ECS force redeploy
    ├──▶ Deploy Frontend → nx build → S3 sync → CloudFront invalidation
    └──▶ Deploy Graphs   → langgraph build → ECR → ECS force redeploy
```

All three deploys run in parallel after tests pass.

## Required GitHub Secrets

| Secret | Description |
|---|---|
| `AWS_ACCESS_KEY_ID` | IAM credentials |
| `AWS_SECRET_ACCESS_KEY` | IAM credentials |
| `CLOUDFRONT_DISTRIBUTION_ID` | CloudFront distribution to invalidate |
| `NX_CLOUD_ACCESS_TOKEN` | Nx Cloud token (build cache) |

## Manual Deploy

### Frontend

```bash
nx run client:build
aws s3 sync dist/apps/client s3://$FRONTEND_BUCKET --delete
aws cloudfront create-invalidation --distribution-id $CLOUDFRONT_DISTRIBUTION_ID --paths "/*"
```

### API

```bash
# Build and push Docker image to ECR, then:
aws ecs update-service \
  --cluster my-saas-cluster \
  --service my-saas-api \
  --force-new-deployment
```

### AI Graphs Service

```bash
cd apps/graphs
langgraph build -t my-saas-graphs:latest
# Tag and push to ECR, then:
aws ecs update-service \
  --cluster my-saas-cluster \
  --service my-saas-graphs \
  --force-new-deployment
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
| ALB | Load balancer, port 8080 for Adminer |
