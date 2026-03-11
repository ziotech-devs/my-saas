import { Duration } from 'aws-cdk-lib';
import type { ISecurityGroup, IVpc } from 'aws-cdk-lib/aws-ec2';
import { SubnetType } from 'aws-cdk-lib/aws-ec2';
import {
  Cluster,
  ContainerImage,
  FargateService,
  FargateTaskDefinition,
  LogDrivers,
  Protocol,
  type Secret as EcsSecret,
} from 'aws-cdk-lib/aws-ecs';
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

export type FargateServiceConstructProps = {
  serviceName: string;
  vpc: IVpc;
  securityGroup: ISecurityGroup;
  containerImage: ContainerImage;
  containerPort: number;
  cpu?: number;
  memoryLimitMiB?: number;
  desiredCount?: number;
  minCapacity?: number;
  maxCapacity?: number;
  environment?: Record<string, string>;
  secrets?: Record<string, EcsSecret>;
  healthCheckCommand?: string[];
  healthCheckPath?: string;
};

export class FargateServiceConstruct extends Construct {
  public readonly cluster: Cluster;
  public readonly service: FargateService;
  public readonly taskDefinition: FargateTaskDefinition;

  constructor(scope: Construct, id: string, props: FargateServiceConstructProps) {
    super(scope, id);

    const {
      serviceName,
      vpc,
      securityGroup,
      containerImage,
      containerPort,
      cpu = 256,
      memoryLimitMiB = 512,
      desiredCount = 1,
      minCapacity = 1,
      maxCapacity = 4,
      environment = {},
      secrets = {},
      healthCheckCommand,
    } = props;

    // ECS Cluster
    this.cluster = new Cluster(this, 'Cluster', {
      clusterName: `${serviceName}-cluster`,
      vpc,
      containerInsights: true,
    });

    // CloudWatch Log Group
    const logGroup = new LogGroup(this, 'LogGroup', {
      logGroupName: `/ecs/${serviceName}`,
      retention: RetentionDays.ONE_MONTH,
    });

    // Fargate Task Definition
    this.taskDefinition = new FargateTaskDefinition(this, 'TaskDef', {
      memoryLimitMiB,
      cpu,
    });

    // Container definition
    const container = this.taskDefinition.addContainer('container', {
      image: containerImage,
      logging: LogDrivers.awsLogs({
        streamPrefix: serviceName,
        logGroup,
      }),
      environment,
      secrets,
      healthCheck: healthCheckCommand
        ? {
            command: healthCheckCommand,
            interval: Duration.seconds(30),
            timeout: Duration.seconds(5),
            retries: 3,
            startPeriod: Duration.seconds(60),
          }
        : undefined,
    });

    container.addPortMappings({
      containerPort,
      protocol: Protocol.TCP,
    });

    // Fargate Service
    this.service = new FargateService(this, 'Service', {
      serviceName,
      cluster: this.cluster,
      taskDefinition: this.taskDefinition,
      desiredCount,
      securityGroups: [securityGroup],
      vpcSubnets: {
        subnetType: SubnetType.PRIVATE_WITH_EGRESS,
      },
      assignPublicIp: false,
      circuitBreaker: {
        rollback: true,
      },
    });

    // Auto Scaling
    const scaling = this.service.autoScaleTaskCount({
      minCapacity,
      maxCapacity,
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
  }
}
