import { CfnOutput, Duration, Stack, type StackProps } from 'aws-cdk-lib';
import type { ISecurityGroup, IVpc } from 'aws-cdk-lib/aws-ec2';
import { SubnetType } from 'aws-cdk-lib/aws-ec2';
import {
  Cluster,
  ContainerImage,
  FargateService,
  FargateTaskDefinition,
  LogDrivers,
  Protocol,
  Secret as EcsSecret,
} from 'aws-cdk-lib/aws-ecs';
import type { IRepository } from 'aws-cdk-lib/aws-ecr';
import {
  ApplicationLoadBalancer,
  ApplicationProtocol,
  ApplicationTargetGroup,
  TargetType,
} from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs';
import type { ISecret } from 'aws-cdk-lib/aws-secretsmanager';
import type { IBucket } from 'aws-cdk-lib/aws-s3';
import type { Construct } from 'constructs';

export type ApiStackProps = StackProps & {
  vpc: IVpc;
  albSecurityGroup: ISecurityGroup;
  ecsSecurityGroup: ISecurityGroup;
  adminerSecurityGroup: ISecurityGroup;
  databaseSecret: ISecret;
  databaseHost: string;
  databasePort: string;
  uploadsBucket: IBucket;
  ecrRepository: IRepository;
  appSecret: ISecret;
  graphsSecret: ISecret;
  graphsSecurityGroup: ISecurityGroup;
  graphsEcrRepository: IRepository;
  graphsDbSecret: ISecret;
  redisEndpoint: string;
  redisPort: string;
};

export class ApiStack extends Stack {
  public readonly alb: ApplicationLoadBalancer;

  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    const {
      vpc,
      albSecurityGroup,
      ecsSecurityGroup,
      adminerSecurityGroup,
      databaseSecret,
      databaseHost,
      databasePort,
      uploadsBucket,
      ecrRepository,
      appSecret,
      graphsSecret,
      graphsSecurityGroup,
      graphsEcrRepository,
      graphsDbSecret,
      redisEndpoint,
      redisPort,
    } = props;

    // Shared ECS Cluster
    const cluster = new Cluster(this, 'Cluster', {
      clusterName: 'my-saas-cluster',
      vpc,
      containerInsights: true,
    });

    // Shared Application Load Balancer
    const alb = new ApplicationLoadBalancer(this, 'Alb', {
      loadBalancerName: 'my-saas-alb',
      vpc,
      internetFacing: true,
      securityGroup: albSecurityGroup,
      vpcSubnets: {
        subnetType: SubnetType.PUBLIC,
      },
    });

    this.alb = alb;

    // ──────────────────────────────────────
    // API Service
    // ──────────────────────────────────────

    const apiLogGroup = new LogGroup(this, 'ApiLogGroup', {
      logGroupName: '/ecs/my-saas-api',
      retention: RetentionDays.ONE_MONTH,
    });

    const apiTaskDef = new FargateTaskDefinition(this, 'ApiTaskDef', {
      memoryLimitMiB: 512,
      cpu: 256,
    });

    uploadsBucket.grantReadWrite(apiTaskDef.taskRole);

    // Inject all app secrets from Secrets Manager
    const appSecretKeys = [
      'PUBLIC_URL',
      'STORAGE_URL',
      'ACCESS_TOKEN_SECRET',
      'REFRESH_TOKEN_SECRET',
      'CHROME_PORT',
      'CHROME_TOKEN',
      'CHROME_URL',
      'CHROME_IGNORE_HTTPS_ERRORS',
      'MAIL_FROM',
      'SMTP_URL',
      'STORAGE_ENDPOINT',
      'STORAGE_PORT',
      'STORAGE_REGION',
      'STORAGE_BUCKET',
      'STORAGE_ACCESS_KEY',
      'STORAGE_SECRET_KEY',
      'STORAGE_USE_SSL',
      'STORAGE_SKIP_BUCKET_CHECK',
      'DISABLE_SIGNUPS',
      'DISABLE_EMAIL_AUTH',
      'GITHUB_CLIENT_ID',
      'GITHUB_CLIENT_SECRET',
      'GITHUB_CALLBACK_URL',
      'GOOGLE_CLIENT_ID',
      'GOOGLE_CLIENT_SECRET',
      'GOOGLE_CALLBACK_URL',
      'VITE_OPENID_NAME',
      'OPENID_AUTHORIZATION_URL',
      'OPENID_CALLBACK_URL',
      'OPENID_CLIENT_ID',
      'OPENID_CLIENT_SECRET',
      'OPENID_ISSUER',
      'OPENID_SCOPE',
      'OPENID_TOKEN_URL',
      'OPENID_USER_INFO_URL',
      'OPENAI_API_KEY',
      'LANGSMITH_API_KEY',
      'LANGSMITH_TRACING_V2',
      'LANGSMITH_PROJECT',
      'LANGSMITH_ENDPOINT',
      'TAVILY_API_KEY',
      'STRIPE_PUBLISHABLE_KEY',
      'STRIPE_SECRET_KEY',
      'STRIPE_WEBHOOK_SECRET',
      'STRIPE_BILLING_PORTAL_RETURN_URL',
      'ANTHROPIC_API_KEY',
    ];

    const ecsSecrets: Record<string, EcsSecret> = {};
    for (const key of appSecretKeys) {
      ecsSecrets[key] = EcsSecret.fromSecretsManager(appSecret, key);
    }

    ecsSecrets['DATABASE_USERNAME'] = EcsSecret.fromSecretsManager(databaseSecret, 'username');
    ecsSecrets['DATABASE_PASSWORD'] = EcsSecret.fromSecretsManager(databaseSecret, 'password');
    ecsSecrets['DATABASE_URL'] = EcsSecret.fromSecretsManager(appSecret, 'DATABASE_URL');

    const apiContainer = apiTaskDef.addContainer('api', {
      image: ContainerImage.fromEcrRepository(ecrRepository, 'latest'),
      logging: LogDrivers.awsLogs({
        streamPrefix: 'api',
        logGroup: apiLogGroup,
      }),
      environment: {
        NODE_ENV: 'production',
        PORT: '3000',
        DATABASE_HOST: databaseHost,
        DATABASE_PORT: databasePort,
        DATABASE_NAME: 'mysaas',
      },
      secrets: ecsSecrets,
      healthCheck: {
        command: ['CMD-SHELL', 'wget -q --spider http://localhost:3000/api/health || exit 1'],
        interval: Duration.seconds(30),
        timeout: Duration.seconds(5),
        retries: 3,
        startPeriod: Duration.seconds(60),
      },
    });

    apiContainer.addPortMappings({
      containerPort: 3000,
      protocol: Protocol.TCP,
    });

    const apiTargetGroup = new ApplicationTargetGroup(this, 'ApiTargetGroup', {
      targetGroupName: 'my-saas-api-tg',
      vpc,
      port: 3000,
      protocol: ApplicationProtocol.HTTP,
      targetType: TargetType.IP,
      healthCheck: {
        path: '/api/health',
        interval: Duration.seconds(10),
        timeout: Duration.seconds(5),
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 2,
      },
    });

    alb.addListener('HttpListener', {
      port: 80,
      defaultTargetGroups: [apiTargetGroup],
    });

    const apiService = new FargateService(this, 'ApiService', {
      serviceName: 'my-saas-api',
      cluster,
      taskDefinition: apiTaskDef,
      desiredCount: 1,
      securityGroups: [ecsSecurityGroup],
      vpcSubnets: {
        subnetType: SubnetType.PRIVATE_WITH_EGRESS,
      },
      assignPublicIp: false,
      circuitBreaker: {
        rollback: true,
      },
    });

    apiService.attachToApplicationTargetGroup(apiTargetGroup);

    const scaling = apiService.autoScaleTaskCount({
      minCapacity: 1,
      maxCapacity: 4,
    });

    scaling.scaleOnCpuUtilization('CpuScaling', {
      targetUtilizationPercent: 70,
      scaleInCooldown: Duration.seconds(60),
      scaleOutCooldown: Duration.seconds(60),
    });

    scaling.scaleOnMemoryUtilization('MemoryScaling', {
      targetUtilizationPercent: 70,
      scaleInCooldown: Duration.seconds(60),
      scaleOutCooldown: Duration.seconds(60),
    });

    // ──────────────────────────────────────
    // Adminer Service
    // ──────────────────────────────────────

    const adminerLogGroup = new LogGroup(this, 'AdminerLogGroup', {
      logGroupName: '/ecs/my-saas-adminer',
      retention: RetentionDays.ONE_WEEK,
    });

    const adminerTaskDef = new FargateTaskDefinition(this, 'AdminerTaskDef', {
      memoryLimitMiB: 512,
      cpu: 256,
    });

    const adminerContainer = adminerTaskDef.addContainer('adminer', {
      image: ContainerImage.fromRegistry('shyim/adminerevo:latest'),
      logging: LogDrivers.awsLogs({
        streamPrefix: 'adminer',
        logGroup: adminerLogGroup,
      }),
      environment: {
        ADMINER_DEFAULT_DRIVER: 'pgsql',
        ADMINER_DEFAULT_SERVER: databaseHost,
        ADMINER_DEFAULT_DB: 'mysaas',
      }
    });

    adminerContainer.addPortMappings({
      containerPort: 8080,
      protocol: Protocol.TCP,
    });

    const adminerTargetGroup = new ApplicationTargetGroup(this, 'AdminerTargetGroup', {
      targetGroupName: 'my-saas-adminer-tg',
      vpc,
      port: 8080,
      protocol: ApplicationProtocol.HTTP,
      targetType: TargetType.IP,
      healthCheck: {
        path: '/',
        interval: Duration.seconds(60),
        timeout: Duration.seconds(10),
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 3,
      },
    });

    alb.addListener('AdminerListener', {
      port: 8080,
      defaultTargetGroups: [adminerTargetGroup],
    });

    const adminerService = new FargateService(this, 'AdminerService', {
      serviceName: 'my-saas-adminer',
      cluster,
      taskDefinition: adminerTaskDef,
      desiredCount: 1,
      securityGroups: [adminerSecurityGroup],
      vpcSubnets: {
        subnetType: SubnetType.PRIVATE_WITH_EGRESS,
      },
      assignPublicIp: false,
    });

    adminerService.attachToApplicationTargetGroup(adminerTargetGroup);

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
      graphsEcsSecrets[key] = EcsSecret.fromSecretsManager(graphsSecret, key);
    }
    // LangGraph uses DATABASE_URI for its checkpointer — stored in graphs-secrets (manually managed)
    graphsEcsSecrets['DATABASE_URI'] = EcsSecret.fromSecretsManager(graphsSecret, 'DATABASE_URI');

    const graphsContainer = graphsTaskDef.addContainer('graphs', {
      image: ContainerImage.fromEcrRepository(graphsEcrRepository, 'latest'),
      logging: LogDrivers.awsLogs({
        streamPrefix: 'graphs',
        logGroup: graphsLogGroup,
      }),
      environment: {
        PORT: '8123',
        REDIS_URI: `redis://${redisEndpoint}:${redisPort}`,
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
        interval: Duration.seconds(10),
        timeout: Duration.seconds(5),
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 2,
      },
    });

    alb.addListener('GraphsListener', {
      port: 8123,
      protocol: ApplicationProtocol.HTTP,
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

    // ──────────────────────────────────────
    // Outputs
    // ──────────────────────────────────────

    new CfnOutput(this, 'AlbDnsName', {
      value: alb.loadBalancerDnsName,
      description: 'Application Load Balancer DNS name',
    });

    new CfnOutput(this, 'ApiUrl', {
      value: `http://${alb.loadBalancerDnsName}`,
      description: 'API URL (port 80)',
    });

    new CfnOutput(this, 'AdminerUrl', {
      value: `http://${alb.loadBalancerDnsName}:8080`,
      description: 'Adminer URL (database management, port 8080)',
    });

    new CfnOutput(this, 'EcsClusterName', {
      value: cluster.clusterName,
      description: 'ECS Cluster name',
    });

    new CfnOutput(this, 'ApiServiceName', {
      value: apiService.serviceName,
      description: 'API ECS Service name',
    });

    new CfnOutput(this, 'AdminerServiceName', {
      value: adminerService.serviceName,
      description: 'Adminer ECS Service name',
    });

    new CfnOutput(this, 'GraphsUrl', {
      value: `http://${alb.loadBalancerDnsName}:8123`,
      description: 'LangGraph API URL (port 8123)',
    });

    new CfnOutput(this, 'GraphsServiceName', {
      value: graphsService.serviceName,
      description: 'Graphs ECS Service name',
    });
  }
}
