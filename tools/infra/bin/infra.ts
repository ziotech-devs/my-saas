#!/usr/bin/env node
import 'source-map-support/register';
import { App } from 'aws-cdk-lib';
import { NetworkStack } from '../lib/stacks/network-stack';
import { DatabaseStack } from '../lib/stacks/database-stack';
import { GraphsDatabaseStack } from '../lib/stacks/graphs-database-stack';
import { CacheStack } from '../lib/stacks/cache-stack';
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

// Graphs database stack — dedicated RDS for LangGraph (depends on network)
const graphsDatabaseStack = new GraphsDatabaseStack(app, 'MySaasGraphsDatabaseStack', {
  env,
  description: 'My SaaS - LangGraph database infrastructure (RDS PostgreSQL)',
  vpc: networkStack.vpc,
  securityGroup: networkStack.graphsRdsSecurityGroup,
});
graphsDatabaseStack.addDependency(networkStack);

// Cache stack — ElastiCache Redis for LangGraph (depends on network)
const cacheStack = new CacheStack(app, 'MySaasCacheStack', {
  env,
  description: 'My SaaS - Cache infrastructure (ElastiCache Redis)',
  vpc: networkStack.vpc,
  securityGroup: networkStack.redisSecurityGroup,
});
cacheStack.addDependency(networkStack);

// API + Adminer stack (depends on network, database, storage, ECR, secrets)
const apiStack = new ApiStack(app, 'MySaasApiStack', {
  env,
  description: 'My SaaS - API + Adminer + Graphs infrastructure (ECS Fargate, ALB)',
  vpc: networkStack.vpc,
  albSecurityGroup: networkStack.albSecurityGroup,
  ecsSecurityGroup: networkStack.ecsSecurityGroup,
  adminerSecurityGroup: networkStack.adminerSecurityGroup,
  graphsSecurityGroup: networkStack.graphsSecurityGroup,
  databaseSecret: databaseStack.secret,
  databaseHost: databaseStack.instance.instanceEndpoint.hostname,
  databasePort: databaseStack.instance.instanceEndpoint.port.toString(),
  uploadsBucket: storageStack.uploadsBucket,
  ecrRepository: ecrStack.apiRepository,
  graphsEcrRepository: ecrStack.graphsRepository,
  appSecret: secretsStack.appSecret,
  graphsSecret: secretsStack.graphsSecret,
  graphsDbSecret: graphsDatabaseStack.secret,
  redisEndpoint: cacheStack.redisEndpoint,
  redisPort: cacheStack.redisPort,
});
apiStack.addDependency(networkStack);
apiStack.addDependency(databaseStack);
apiStack.addDependency(graphsDatabaseStack);
apiStack.addDependency(cacheStack);
apiStack.addDependency(storageStack);
apiStack.addDependency(ecrStack);
apiStack.addDependency(secretsStack);

// Frontend stack — depends on ApiStack for ALB DNS name (CloudFront /api/* behavior)
const frontendStack = new FrontendStack(app, 'MySaasFrontendStack', {
  env,
  description: 'My SaaS - Frontend infrastructure (S3 + CloudFront)',
  albDnsName: apiStack.alb.loadBalancerDnsName,
});
frontendStack.addDependency(apiStack);

app.synth();
