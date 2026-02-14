import { Stack, type StackProps } from 'aws-cdk-lib';
import {
  Vpc,
  SubnetType,
  SecurityGroup,
  Port,
  Peer,
} from 'aws-cdk-lib/aws-ec2';
import type { Construct } from 'constructs';

export type NetworkStackProps = StackProps;

export class NetworkStack extends Stack {
  public readonly vpc: Vpc;
  public readonly albSecurityGroup: SecurityGroup;
  public readonly ecsSecurityGroup: SecurityGroup;
  public readonly adminerSecurityGroup: SecurityGroup;
  public readonly rdsSecurityGroup: SecurityGroup;

  constructor(scope: Construct, id: string, props?: NetworkStackProps) {
    super(scope, id, props);

    this.vpc = new Vpc(this, 'Vpc', {
      vpcName: 'my-saas-vpc',
      maxAzs: 2,
      natGateways: 1,
      subnetConfiguration: [
        {
          name: 'Public',
          subnetType: SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          name: 'Private',
          subnetType: SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24,
        },
      ],
    });

    this.albSecurityGroup = new SecurityGroup(this, 'AlbSecurityGroup', {
      vpc: this.vpc,
      securityGroupName: 'my-saas-alb-sg',
      description: 'Security group for Application Load Balancer',
      allowAllOutbound: true,
    });

    this.albSecurityGroup.addIngressRule(
      Peer.anyIpv4(),
      Port.tcp(80),
      'Allow HTTP from internet'
    );

    this.albSecurityGroup.addIngressRule(
      Peer.anyIpv4(),
      Port.tcp(443),
      'Allow HTTPS from internet'
    );

    this.albSecurityGroup.addIngressRule(
      Peer.anyIpv4(),
      Port.tcp(8080),
      'Allow Adminer from internet'
    );

    this.ecsSecurityGroup = new SecurityGroup(this, 'EcsSecurityGroup', {
      vpc: this.vpc,
      securityGroupName: 'my-saas-ecs-sg',
      description: 'Security group for ECS Fargate tasks',
      allowAllOutbound: true,
    });

    this.ecsSecurityGroup.addIngressRule(
      this.albSecurityGroup,
      Port.tcp(3000),
      'Allow traffic from ALB on port 3000'
    );

    this.adminerSecurityGroup = new SecurityGroup(this, 'AdminerSecurityGroup', {
      vpc: this.vpc,
      securityGroupName: 'my-saas-adminer-sg',
      description: 'Security group for Adminer Fargate tasks',
      allowAllOutbound: true,
    });

    this.adminerSecurityGroup.addIngressRule(
      this.albSecurityGroup,
      Port.tcp(8080),
      'Allow traffic from ALB on port 8080'
    );

    this.rdsSecurityGroup = new SecurityGroup(this, 'RdsSecurityGroup', {
      vpc: this.vpc,
      securityGroupName: 'my-saas-rds-sg',
      description: 'Security group for RDS PostgreSQL',
      allowAllOutbound: false,
    });

    this.rdsSecurityGroup.addIngressRule(
      this.ecsSecurityGroup,
      Port.tcp(5432),
      'Allow PostgreSQL from ECS'
    );

    this.rdsSecurityGroup.addIngressRule(
      this.adminerSecurityGroup,
      Port.tcp(5432),
      'Allow PostgreSQL from Adminer'
    );
  }
}
