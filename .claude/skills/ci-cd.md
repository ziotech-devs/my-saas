---
description: GitHub Actions CI/CD pipeline for My SaaS — build, test, and deploy API (Docker/ECR/ECS) and frontend (S3/CloudFront) to AWS
user-invocable: true
---

# CI/CD Skill

Manage the GitHub Actions deployment pipeline for My SaaS. Deploys API and frontend to AWS automatically on every push to `main`.

## Workflow: `.github/workflows/deploy.yml`

```
push to main
  └─► test  (pnpm install → pnpm test → pnpm build)
        ├─► deploy-api
        │     1. Configure AWS credentials
        │     2. Login to ECR
        │     3. docker build --platform linux/amd64
        │     4. docker push → ECR my-saas-api:latest
        │     5. aws ecs update-service --force-new-deployment (my-saas-api)
        │
        ├─► deploy-graphs
        │     1. Configure AWS credentials
        │     2. Login to ECR
        │     3. pip install langgraph-cli
        │     4. langgraph build -t my-saas-graphs:latest
        │     5. docker tag + push → ECR my-saas-graphs:latest
        │     6. aws ecs update-service --force-new-deployment (my-saas-graphs)
        │
        └─► deploy-frontend
              1. Configure AWS credentials
              2. nx run client:build
              3. aws s3 sync dist/apps/client → S3 --delete
              4. aws cloudfront create-invalidation --paths "/*"
```

`deploy-api`, `deploy-graphs`, and `deploy-frontend` run in **parallel** after `test` passes.

## Workflow: `.github/workflows/aws-cdk.yml`

Triggers on push to `main` when `tools/infra/**` changes (or manually). Deploys all CDK stacks:

```
push to main (tools/infra/** changed)
  └─► deploy-aws-cdk
        1. Configure AWS credentials
        2. cd tools/infra
        3. npx cdk deploy --all --require-approval never --hotswap-fallback --concurrency 4
```

Stacks deployed: ECR → Secrets → Storage → Network → Database / GraphsDatabase / Cache → API → Frontend

---

## GitHub Secrets (repo Settings → Secrets → Actions)

| Secret | Value |
|--------|-------|
| `AWS_ACCESS_KEY_ID` | IAM user access key |
| `AWS_SECRET_ACCESS_KEY` | IAM user secret key |
| `CLOUDFRONT_DISTRIBUTION_ID` | CloudFront distribution ID |
| `NX_CLOUD_ACCESS_TOKEN` | Nx Cloud token (used in API docker build) |

The IAM user needs: `ecr:*`, `ecs:UpdateService`, `s3:*` on frontend bucket, `cloudfront:CreateInvalidation`.

---

## AWS Constants (account 301394200094, us-east-1)

| Resource | Value |
|----------|-------|
| ECR registry | `301394200094.dkr.ecr.us-east-1.amazonaws.com` |
| ECR repository (API) | `my-saas-api` |
| ECR repository (LangGraph) | `my-saas-graphs` |
| ECS cluster | `my-saas-cluster` |
| ECS service (API) | `my-saas-api` |
| ECS service (LangGraph) | `my-saas-graphs` |
| Frontend S3 | `my-saas-frontend-301394200094-us-east-1` |

---

## Manual Deploy (same steps as CI)

### API
```bash
# Authenticate
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin 301394200094.dkr.ecr.us-east-1.amazonaws.com

# Build (M1/M2 Mac: add --platform linux/amd64)
docker build --platform linux/amd64 -t my-saas-api .

# Tag + push
docker tag my-saas-api:latest 301394200094.dkr.ecr.us-east-1.amazonaws.com/my-saas-api:latest
docker push 301394200094.dkr.ecr.us-east-1.amazonaws.com/my-saas-api:latest

# Redeploy
aws ecs update-service --cluster my-saas-cluster --service my-saas-api --force-new-deployment

# Monitor
aws logs tail /ecs/my-saas-api --follow
```

### Frontend
```bash
nx run client:build
aws s3 sync dist/apps/client s3://my-saas-frontend-301394200094-us-east-1 --delete
aws cloudfront create-invalidation --distribution-id <DIST_ID> --paths "/*"
```

---

## Troubleshooting

### ECS deployment fails
Check container logs first:
```bash
aws logs tail /ecs/my-saas-api --follow
```

Most common cause: missing/invalid values in `my-saas/app-secrets` → Zod config validation crashes on startup. See the infra skill for required secrets.

### Check ECS task stopped reason
```bash
aws ecs describe-tasks --cluster my-saas-cluster \
  --tasks $(aws ecs list-tasks --cluster my-saas-cluster --desired-status STOPPED --query 'taskArns[0]' --output text) \
  --query 'tasks[0].containers[*].[name,reason,exitCode]' --output table
```

### GitHub Actions: ECR login fails
Ensure `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` secrets are set in the repo and the IAM user has `ecr:GetAuthorizationToken` + `ecr:BatchCheckLayerAvailability` + `ecr:PutImage` permissions.
