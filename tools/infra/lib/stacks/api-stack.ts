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
import {
  ApplicationLoadBalancer,
  ApplicationProtocol,
  ApplicationTargetGroup,
  TargetType,
} from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs';
import type { ISecret } from 'aws-cdk-lib/aws-secretsmanager';
import type { IBucket } from 'aws-cdk-lib/aws-s3';
import { ScalableTarget, ServiceNamespace } from 'aws-cdk-lib/aws-applicationautoscaling';
import type { Construct } from 'constructs';

export type ApiStackProps = StackProps & {
  vpc: IVpc;
  albSecurityGroup: ISecurityGroup;
  ecsSecurityGroup: ISecurityGroup;
  databaseSecret: ISecret;
  databaseHost: string;
  databasePort: string;
  uploadsBucket: IBucket;
  frontendUrl: string;
};

export class ApiStack extends Stack {
  public readonly alb: ApplicationLoadBalancer;
  public readonly albUrl: string;

  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    const {
      vpc,
      albSecurityGroup,
      ecsSecurityGroup,
      databaseSecret,
      databaseHost,
      databasePort,
      uploadsBucket,
      frontendUrl,
    } = props;

    // ECS Cluster
    const cluster = new Cluster(this, 'Cluster', {
      clusterName: 'my-saas-cluster',
      vpc,
      containerInsights: true,
    });

    // CloudWatch Log Group
    const logGroup = new LogGroup(this, 'ApiLogGroup', {
      logGroupName: '/ecs/my-saas-api',
      retention: RetentionDays.ONE_MONTH,
    });

    // Fargate Task Definition
    const taskDefinition = new FargateTaskDefinition(this, 'ApiTaskDef', {
      memoryLimitMiB: 512,
      cpu: 256,
    });

    // Grant S3 access to task role
    uploadsBucket.grantReadWrite(taskDefinition.taskRole);

    // Container definition
    const container = taskDefinition.addContainer('api', {
      image: ContainerImage.fromRegistry('node:20-alpine'),
      logging: LogDrivers.awsLogs({
        streamPrefix: 'api',
        logGroup,
      }),
      environment: {
        NODE_ENV: 'production',
        PORT: '3000',
        DATABASE_HOST: databaseHost,
        DATABASE_PORT: databasePort,
        DATABASE_NAME: 'mysaas',
        STORAGE_BUCKET: uploadsBucket.bucketName,
        STORAGE_REGION: this.region,
        PUBLIC_URL: frontendUrl,
      },
      secrets: {
        DATABASE_USERNAME: EcsSecret.fromSecretsManager(databaseSecret, 'username'),
        DATABASE_PASSWORD: EcsSecret.fromSecretsManager(databaseSecret, 'password'),
      },
      healthCheck: {
        command: ['CMD-SHELL', 'wget -q --spider http://localhost:3000/api/health || exit 1'],
        interval: Duration.seconds(30),
        timeout: Duration.seconds(5),
        retries: 3,
        startPeriod: Duration.seconds(60),
      },
    });

    container.addPortMappings({
      containerPort: 3000,
      protocol: Protocol.TCP,
    });

    // Application Load Balancer
    this.alb = new ApplicationLoadBalancer(this, 'Alb', {
      loadBalancerName: 'my-saas-alb',
      vpc,
      internetFacing: true,
      securityGroup: albSecurityGroup,
      vpcSubnets: {
        subnetType: SubnetType.PUBLIC,
      },
    });

    // Target Group
    const targetGroup = new ApplicationTargetGroup(this, 'ApiTargetGroup', {
      targetGroupName: 'my-saas-api-tg',
      vpc,
      port: 3000,
      protocol: ApplicationProtocol.HTTP,
      targetType: TargetType.IP,
      healthCheck: {
        path: '/api/health',
        interval: Duration.seconds(30),
        timeout: Duration.seconds(5),
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 3,
      },
    });

    // HTTP Listener
    this.alb.addListener('HttpListener', {
      port: 80,
      defaultTargetGroups: [targetGroup],
    });

    // Fargate Service
    const service = new FargateService(this, 'ApiService', {
      serviceName: 'my-saas-api',
      cluster,
      taskDefinition,
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

    service.attachToApplicationTargetGroup(targetGroup);

    // Auto Scaling
    const scaling = service.autoScaleTaskCount({
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

    this.albUrl = `http://${this.alb.loadBalancerDnsName}`;

    // Outputs
    new CfnOutput(this, 'AlbDnsName', {
      value: this.alb.loadBalancerDnsName,
      description: 'Application Load Balancer DNS name',
    });

    new CfnOutput(this, 'AlbUrl', {
      value: this.albUrl,
      description: 'Application Load Balancer URL',
    });

    new CfnOutput(this, 'EcsClusterName', {
      value: cluster.clusterName,
      description: 'ECS Cluster name',
    });

    new CfnOutput(this, 'EcsServiceName', {
      value: service.serviceName,
      description: 'ECS Service name',
    });
  }
}
