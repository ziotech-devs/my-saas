#!/usr/bin/env node
import 'source-map-support/register';
import { App } from 'aws-cdk-lib';
import { NetworkStack } from '../lib/stacks/network-stack';
import { DatabaseStack } from '../lib/stacks/database-stack';
import { StorageStack } from '../lib/stacks/storage-stack';
import { FrontendStack } from '../lib/stacks/frontend-stack';
import { ApiStack } from '../lib/stacks/api-stack';

const app = new App();

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT || process.env.AWS_ACCOUNT_ID,
  region: process.env.CDK_DEFAULT_REGION || process.env.AWS_REGION || 'us-east-1',
};

const networkStack = new NetworkStack(app, 'MySaasNetworkStack', {
  env,
  description: 'My SaaS - Network infrastructure (VPC, subnets, security groups)',
});

const databaseStack = new DatabaseStack(app, 'MySaasDatabaseStack', {
  env,
  description: 'My SaaS - Database infrastructure (RDS PostgreSQL)',
  vpc: networkStack.vpc,
  securityGroup: networkStack.rdsSecurityGroup,
});

const storageStack = new StorageStack(app, 'MySaasStorageStack', {
  env,
  description: 'My SaaS - Storage infrastructure (S3)',
});

const frontendStack = new FrontendStack(app, 'MySaasFrontendStack', {
  env,
  description: 'My SaaS - Frontend infrastructure (S3 + CloudFront)',
});

const apiStack = new ApiStack(app, 'MySaasApiStack', {
  env,
  description: 'My SaaS - API infrastructure (ECS Fargate)',
  vpc: networkStack.vpc,
  albSecurityGroup: networkStack.albSecurityGroup,
  ecsSecurityGroup: networkStack.ecsSecurityGroup,
  databaseSecret: databaseStack.secret,
  databaseHost: databaseStack.instance.instanceEndpoint.hostname,
  databasePort: databaseStack.instance.instanceEndpoint.port.toString(),
  uploadsBucket: storageStack.uploadsBucket,
  frontendUrl: frontendStack.distributionUrl,
});

databaseStack.addDependency(networkStack);
apiStack.addDependency(networkStack);
apiStack.addDependency(databaseStack);
apiStack.addDependency(storageStack);
apiStack.addDependency(frontendStack);

app.synth();
