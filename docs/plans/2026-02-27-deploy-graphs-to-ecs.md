# Deploy Graphs App to AWS ECS Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Deploy the LangGraph Python graphs app as a Fargate service on the existing ECS cluster (`my-saas-cluster`), exposed via ALB on port 8123.

**Architecture:** Add a graphs ECR repository to `EcrStack`, a new `graphsSecurityGroup` to `NetworkStack` (ALB → port 8123), a new Fargate service + ALB listener on port 8123 to `ApiStack`, and wire everything together in `infra.ts`. Build the image via `langgraph build`, push to ECR, deploy CDK, then redeploy the service.

**Tech Stack:** AWS CDK (TypeScript), AWS ECS Fargate, ECR, ALB, LangGraph CLI, Docker

**Key paths:**
- CDK entry: `tools/infra/bin/infra.ts`
- ECR stack: `tools/infra/lib/stacks/ecr-stack.ts`
- Network stack: `tools/infra/lib/stacks/network-stack.ts`
- API stack: `tools/infra/lib/stacks/api-stack.ts`
- Graphs app: `apps/graphs/`
- Graphs config: `apps/graphs/langgraph.json`

**Secrets already in `my-saas/app-secrets` (Secrets Manager):**
`OPENAI_API_KEY`, `LANGSMITH_API_KEY`, `LANGSMITH_TRACING_V2`, `LANGSMITH_PROJECT`, `LANGSMITH_ENDPOINT`, `TAVILY_API_KEY`

---

### Task 1: Add graphs ECR repository to EcrStack

**Files:**
- Modify: `tools/infra/lib/stacks/ecr-stack.ts`

**Step 1: Read the current file**

Open `tools/infra/lib/stacks/ecr-stack.ts` and confirm current content.

**Step 2: Add `graphsRepository`**

```typescript
import { RemovalPolicy, Stack, type StackProps } from 'aws-cdk-lib';
import { Repository, TagMutability } from 'aws-cdk-lib/aws-ecr';
import type { Construct } from 'constructs';

export type EcrStackProps = StackProps;

export class EcrStack extends Stack {
  public readonly apiRepository: Repository;
  public readonly graphsRepository: Repository;

  constructor(scope: Construct, id: string, props?: EcrStackProps) {
    super(scope, id, props);

    this.apiRepository = new Repository(this, 'ApiRepository', {
      repositoryName: 'my-saas-api',
      imageTagMutability: TagMutability.MUTABLE,
      removalPolicy: RemovalPolicy.RETAIN,
      lifecycleRules: [
        {
          maxImageCount: 10,
          description: 'Keep only the last 10 images',
        },
      ],
    });

    this.graphsRepository = new Repository(this, 'GraphsRepository', {
      repositoryName: 'my-saas-graphs',
      imageTagMutability: TagMutability.MUTABLE,
      removalPolicy: RemovalPolicy.RETAIN,
      lifecycleRules: [
        {
          maxImageCount: 10,
          description: 'Keep only the last 10 images',
        },
      ],
    });
  }
}
```

**Step 3: Commit**

```bash
git add tools/infra/lib/stacks/ecr-stack.ts
git commit -m "feat(infra): add graphs ECR repository"
```

---

### Task 2: Add graphs security group to NetworkStack

LangGraph serves on port 8123. The ALB needs to reach the graphs container, and the internet needs to reach the ALB on that port.

**Files:**
- Modify: `tools/infra/lib/stacks/network-stack.ts`

**Step 1: Add `graphsSecurityGroup` and ALB ingress rule for port 8123**

Add after the `adminerSecurityGroup` block (around line 79), before `rdsSecurityGroup`:

```typescript
// Add to class public properties:
public readonly graphsSecurityGroup: SecurityGroup;
```

Add this block after the `adminerSecurityGroup` ingress rule:

```typescript
this.albSecurityGroup.addIngressRule(
  Peer.anyIpv4(),
  Port.tcp(8123),
  'Allow LangGraph from internet'
);

this.graphsSecurityGroup = new SecurityGroup(this, 'GraphsSecurityGroup', {
  vpc: this.vpc,
  securityGroupName: 'my-saas-graphs-sg',
  description: 'Security group for LangGraph Fargate tasks',
  allowAllOutbound: true,
});

this.graphsSecurityGroup.addIngressRule(
  this.albSecurityGroup,
  Port.tcp(8123),
  'Allow traffic from ALB on port 8123'
);
```

**Step 2: Commit**

```bash
git add tools/infra/lib/stacks/network-stack.ts
git commit -m "feat(infra): add graphs security group and ALB port 8123"
```

---

### Task 3: Add graphs Fargate service to ApiStack

**Files:**
- Modify: `tools/infra/lib/stacks/api-stack.ts`

**Step 1: Add `graphsEcrRepository` and `graphsSecurityGroup` to props**

Update the `ApiStackProps` type:

```typescript
export type ApiStackProps = StackProps & {
  vpc: IVpc;
  albSecurityGroup: ISecurityGroup;
  ecsSecurityGroup: ISecurityGroup;
  adminerSecurityGroup: ISecurityGroup;
  graphsSecurityGroup: ISecurityGroup;          // NEW
  databaseSecret: ISecret;
  databaseHost: string;
  databasePort: string;
  uploadsBucket: IBucket;
  ecrRepository: IRepository;
  graphsEcrRepository: IRepository;            // NEW
  appSecret: ISecret;
};
```

**Step 2: Destructure new props in constructor**

Add `graphsSecurityGroup` and `graphsEcrRepository` to the destructured props:

```typescript
const {
  vpc,
  albSecurityGroup,
  ecsSecurityGroup,
  adminerSecurityGroup,
  graphsSecurityGroup,      // NEW
  databaseSecret,
  databaseHost,
  databasePort,
  uploadsBucket,
  ecrRepository,
  graphsEcrRepository,      // NEW
  appSecret,
} = props;
```

**Step 3: Add graphs service block at the end of ApiStack constructor (before the Outputs section)**

Add `graphsSecretKeys` and the Fargate service for graphs. Paste this block before the `// ── Outputs ──` section:

```typescript
// ──────────────────────────────────────
// Graphs Service (LangGraph)
// ──────────────────────────────────────

const graphsLogGroup = new LogGroup(this, 'GraphsLogGroup', {
  logGroupName: '/ecs/my-saas-graphs',
  retention: RetentionDays.ONE_MONTH,
});

const graphsTaskDef = new FargateTaskDefinition(this, 'GraphsTaskDef', {
  memoryLimitMiB: 1024,
  cpu: 512,
});

const graphsSecretKeys = [
  'OPENAI_API_KEY',
  'LANGSMITH_API_KEY',
  'LANGSMITH_TRACING_V2',
  'LANGSMITH_PROJECT',
  'LANGSMITH_ENDPOINT',
  'TAVILY_API_KEY',
];

const graphsEcsSecrets: Record<string, EcsSecret> = {};
for (const key of graphsSecretKeys) {
  graphsEcsSecrets[key] = EcsSecret.fromSecretsManager(appSecret, key);
}

const graphsContainer = graphsTaskDef.addContainer('graphs', {
  image: ContainerImage.fromEcrRepository(graphsEcrRepository, 'latest'),
  logging: LogDrivers.awsLogs({
    streamPrefix: 'graphs',
    logGroup: graphsLogGroup,
  }),
  environment: {
    PORT: '8123',
  },
  secrets: graphsEcsSecrets,
  healthCheck: {
    command: ['CMD-SHELL', 'curl -f http://localhost:8123/ok || exit 1'],
    interval: Duration.seconds(30),
    timeout: Duration.seconds(5),
    retries: 3,
    startPeriod: Duration.seconds(90),
  },
});

graphsContainer.addPortMappings({
  containerPort: 8123,
  protocol: Protocol.TCP,
});

const graphsTargetGroup = new ApplicationTargetGroup(this, 'GraphsTargetGroup', {
  targetGroupName: 'my-saas-graphs-tg',
  vpc,
  port: 8123,
  protocol: ApplicationProtocol.HTTP,
  targetType: TargetType.IP,
  healthCheck: {
    path: '/ok',
    interval: Duration.seconds(30),
    timeout: Duration.seconds(5),
    healthyThresholdCount: 2,
    unhealthyThresholdCount: 3,
  },
});

alb.addListener('GraphsListener', {
  port: 8123,
  defaultTargetGroups: [graphsTargetGroup],
});

const graphsService = new FargateService(this, 'GraphsService', {
  serviceName: 'my-saas-graphs',
  cluster,
  taskDefinition: graphsTaskDef,
  desiredCount: 1,
  securityGroups: [graphsSecurityGroup],
  vpcSubnets: {
    subnetType: SubnetType.PRIVATE_WITH_EGRESS,
  },
  assignPublicIp: false,
  circuitBreaker: {
    rollback: true,
  },
});

graphsService.attachToApplicationTargetGroup(graphsTargetGroup);
```

**Step 4: Add CfnOutputs for graphs (in the Outputs section)**

```typescript
new CfnOutput(this, 'GraphsUrl', {
  value: `http://${alb.loadBalancerDnsName}:8123`,
  description: 'LangGraph API URL (port 8123)',
});

new CfnOutput(this, 'GraphsServiceName', {
  value: graphsService.serviceName,
  description: 'Graphs ECS Service name',
});
```

**Step 5: Commit**

```bash
git add tools/infra/lib/stacks/api-stack.ts
git commit -m "feat(infra): add LangGraph ECS Fargate service on port 8123"
```

---

### Task 4: Wire up new props in infra.ts

**Files:**
- Modify: `tools/infra/bin/infra.ts`

**Step 1: Pass `graphsSecurityGroup` and `graphsEcrRepository` to ApiStack**

Update the `apiStack` instantiation:

```typescript
const apiStack = new ApiStack(app, 'MySaasApiStack', {
  env,
  description: 'My SaaS - API + Adminer + Graphs infrastructure (ECS Fargate, ALB)',
  vpc: networkStack.vpc,
  albSecurityGroup: networkStack.albSecurityGroup,
  ecsSecurityGroup: networkStack.ecsSecurityGroup,
  adminerSecurityGroup: networkStack.adminerSecurityGroup,
  graphsSecurityGroup: networkStack.graphsSecurityGroup,   // NEW
  databaseSecret: databaseStack.secret,
  databaseHost: databaseStack.instance.instanceEndpoint.hostname,
  databasePort: databaseStack.instance.instanceEndpoint.port.toString(),
  uploadsBucket: storageStack.uploadsBucket,
  ecrRepository: ecrStack.apiRepository,
  graphsEcrRepository: ecrStack.graphsRepository,          // NEW
  appSecret: secretsStack.appSecret,
});
```

**Step 2: Commit**

```bash
git add tools/infra/bin/infra.ts
git commit -m "feat(infra): wire graphs ECR and security group into ApiStack"
```

---

### Task 5: Fix the graphs Dockerfile

The current `apps/graphs/Dockerfile` contains `FROM my-saas-server:local` which is wrong. `langgraph build` generates its own Dockerfile internally from `langgraph.json`, so this file is unused and confusing.

**Files:**
- Modify: `apps/graphs/Dockerfile`

**Step 1: Replace with a comment explaining it's managed by langgraph CLI**

```dockerfile
# This Dockerfile is NOT used directly.
# The Docker image is built via: langgraph build -t my-saas-graphs:latest
# LangGraph CLI generates the Dockerfile internally from langgraph.json.
# See: https://langchain-ai.github.io/langgraph/cloud/reference/cli/
```

**Step 2: Commit**

```bash
git add apps/graphs/Dockerfile
git commit -m "chore(graphs): clarify Dockerfile is managed by langgraph CLI"
```

---

### Task 6: Build the graphs Docker image and push to ECR

Run these commands locally. Requires Docker running and AWS credentials configured.

**Step 1: Build the LangGraph Docker image**

```bash
cd apps/graphs
langgraph build -t my-saas-graphs:latest
```

Expected: Docker image `my-saas-graphs:latest` created locally.

Verify:
```bash
docker images | grep my-saas-graphs
```

**Step 2: Authenticate Docker with ECR**

```bash
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin \
  301394200094.dkr.ecr.us-east-1.amazonaws.com
```

Expected: `Login Succeeded`

**Step 3: Tag and push the image**

```bash
docker tag my-saas-graphs:latest \
  301394200094.dkr.ecr.us-east-1.amazonaws.com/my-saas-graphs:latest

docker push \
  301394200094.dkr.ecr.us-east-1.amazonaws.com/my-saas-graphs:latest
```

Expected: Image pushed, digest printed.

---

### Task 7: Deploy CDK changes

Run from the repo root. Requires AWS credentials configured.

**Step 1: Synthesize to verify no errors**

```bash
cd /Users/talkenig/Code/boilerplates/my-saas
npx cdk synth --app "npx ts-node tools/infra/bin/infra.ts"
```

Expected: CloudFormation templates printed, no errors.

**Step 2: Deploy ECR stack first (new repository)**

```bash
npx cdk deploy MySaasEcrStack \
  --app "npx ts-node tools/infra/bin/infra.ts" \
  --require-approval never
```

Expected: `MySaasEcrStack` deployed, `my-saas-graphs` ECR repo created.

**Step 3: Deploy Network stack (new security group + ALB port)**

```bash
npx cdk deploy MySaasNetworkStack \
  --app "npx ts-node tools/infra/bin/infra.ts" \
  --require-approval never
```

**Step 4: Deploy API stack (new Fargate service)**

```bash
npx cdk deploy MySaasApiStack \
  --app "npx ts-node tools/infra/bin/infra.ts" \
  --require-approval never
```

Expected: New `my-saas-graphs` ECS service created, ALB listener on 8123 added. Outputs include `GraphsUrl`.

**Step 5: Verify service is running**

```bash
aws ecs describe-services \
  --cluster my-saas-cluster \
  --services my-saas-graphs \
  --region us-east-1 \
  --query "services[0].{status:status,running:runningCount,desired:desiredCount}"
```

Expected: `{"status": "ACTIVE", "running": 1, "desired": 1}`

**Step 6: Check health endpoint**

```bash
# Get ALB DNS from CloudFormation outputs
ALB_DNS=$(aws cloudformation describe-stacks \
  --stack-name MySaasApiStack \
  --query "Stacks[0].Outputs[?OutputKey=='AlbDnsName'].OutputValue" \
  --output text)

curl http://$ALB_DNS:8123/ok
```

Expected: `{"status": "ok"}` or similar 200 response.

---

### Task 8: Update Nx project.json with deploy command (optional)

**Files:**
- Modify: `apps/graphs/project.json`

**Step 1: Add deploy target**

```json
{
  "name": "graphs",
  "$schema": "../../node_modules/nx/schemas/project-schema.json",
  "sourceRoot": "apps/graphs",
  "projectType": "application",
  "targets": {
    "serve": {
      "executor": "nx:run-commands",
      "options": {
        "command": "cd apps/graphs && langgraph dev",
        "envFile": ".env"
      }
    },
    "build": {
      "executor": "nx:run-commands",
      "options": {
        "command": "cd apps/graphs && langgraph build -t my-saas-graphs",
        "envFile": ".env"
      }
    },
    "deploy": {
      "executor": "nx:run-commands",
      "options": {
        "commands": [
          "cd apps/graphs && langgraph build -t my-saas-graphs:latest",
          "aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 301394200094.dkr.ecr.us-east-1.amazonaws.com",
          "docker tag my-saas-graphs:latest 301394200094.dkr.ecr.us-east-1.amazonaws.com/my-saas-graphs:latest",
          "docker push 301394200094.dkr.ecr.us-east-1.amazonaws.com/my-saas-graphs:latest",
          "aws ecs update-service --cluster my-saas-cluster --service my-saas-graphs --force-new-deployment --region us-east-1"
        ],
        "parallel": false
      }
    }
  },
  "tags": ["backend", "python"]
}
```

**Step 2: Commit**

```bash
git add apps/graphs/project.json
git commit -m "feat(graphs): add deploy nx target for ECS"
```

**Future deploys (after initial CDK setup):**
```bash
nx run graphs:deploy
```
