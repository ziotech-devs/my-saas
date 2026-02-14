#!/usr/bin/env node
import 'source-map-support/register';
import { App } from 'aws-cdk-lib';
import { NetworkStack } from '../lib/stacks/network-stack';
import { DatabaseStack } from '../lib/stacks/database-stack';
import { StorageStack } from '../lib/stacks/storage-stack';
import { FrontendStack } from '../lib/stacks/frontend-stack';
import { EcrStack } from '../lib/stacks/ecr-stack';
import { SecretsStack } from '../lib/stacks/secrets-stack';
import { ApiStack } from '../lib/stacks/api-stack';

const app = new App();

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT || process.env.AWS_ACCOUNT_ID,
  region: process.env.CDK_DEFAULT_REGION || process.env.AWS_REGION || 'us-east-1',
};

// Standalone stacks (no dependencies)
const ecrStack = new EcrStack(app, 'MySaasEcrStack', {
  env,
  description: 'My SaaS - Container registry (ECR)',
});

const secretsStack = new SecretsStack(app, 'MySaasSecretsStack', {
  env,
  description: 'My SaaS - Application secrets (Secrets Manager)',
});

const storageStack = new StorageStack(app, 'MySaasStorageStack', {
  env,
  description: 'My SaaS - Storage infrastructure (S3)',
});

const frontendStack = new FrontendStack(app, 'MySaasFrontendStack', {
  env,
  description: 'My SaaS - Frontend infrastructure (S3 + CloudFront)',
});

// Network stack (foundation for all VPC-dependent resources)
const networkStack = new NetworkStack(app, 'MySaasNetworkStack', {
  env,
  description: 'My SaaS - Network infrastructure (VPC, subnets, security groups)',
});

// Database stack (depends on network)
const databaseStack = new DatabaseStack(app, 'MySaasDatabaseStack', {
  env,
  description: 'My SaaS - Database infrastructure (RDS PostgreSQL)',
  vpc: networkStack.vpc,
  securityGroup: networkStack.rdsSecurityGroup,
});
databaseStack.addDependency(networkStack);

// API + Adminer stack (depends on network, database, storage, frontend, ECR, secrets)
const apiStack = new ApiStack(app, 'MySaasApiStack', {
  env,
  description: 'My SaaS - API + Adminer infrastructure (ECS Fargate, ALB)',
  vpc: networkStack.vpc,
  albSecurityGroup: networkStack.albSecurityGroup,
  ecsSecurityGroup: networkStack.ecsSecurityGroup,
  adminerSecurityGroup: networkStack.adminerSecurityGroup,
  databaseSecret: databaseStack.secret,
  databaseHost: databaseStack.instance.instanceEndpoint.hostname,
  databasePort: databaseStack.instance.instanceEndpoint.port.toString(),
  uploadsBucket: storageStack.uploadsBucket,
  frontendUrl: frontendStack.distributionUrl,
  ecrRepository: ecrStack.apiRepository,
  appSecret: secretsStack.appSecret,
});
apiStack.addDependency(networkStack);
apiStack.addDependency(databaseStack);
apiStack.addDependency(storageStack);
apiStack.addDependency(frontendStack);
apiStack.addDependency(ecrStack);
apiStack.addDependency(secretsStack);

app.synth();
