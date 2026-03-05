import { Duration, RemovalPolicy, Stack, type StackProps } from 'aws-cdk-lib';
import {
  type ISecurityGroup,
  type IVpc,
  SubnetType,
  InstanceType,
  InstanceClass,
  InstanceSize,
} from 'aws-cdk-lib/aws-ec2';
import {
  DatabaseInstance,
  DatabaseInstanceEngine,
  PostgresEngineVersion,
  Credentials,
  StorageType,
} from 'aws-cdk-lib/aws-rds';
import type { ISecret } from 'aws-cdk-lib/aws-secretsmanager';
import type { Construct } from 'constructs';

export type DatabaseStackProps = StackProps & {
  vpc: IVpc;
  securityGroup: ISecurityGroup;
};

export class DatabaseStack extends Stack {
  public readonly instance: DatabaseInstance;
  public readonly secret: ISecret;

  constructor(scope: Construct, id: string, props: DatabaseStackProps) {
    super(scope, id, props);

    const { vpc, securityGroup } = props;

    // RDS PostgreSQL instance
    this.instance = new DatabaseInstance(this, 'PostgresInstance', {
      instanceIdentifier: 'my-saas-db',
      engine: DatabaseInstanceEngine.postgres({
        version: PostgresEngineVersion.VER_16_4,
      }),
      // t3.micro for cost efficiency (free tier eligible)
      instanceType: InstanceType.of(InstanceClass.T3, InstanceSize.MICRO),
      vpc,
      vpcSubnets: {
        subnetType: SubnetType.PRIVATE_WITH_EGRESS,
      },
      securityGroups: [securityGroup],
      credentials: Credentials.fromGeneratedSecret('postgres', {
        secretName: 'my-saas/database-credentials',
      }),
      databaseName: 'mysaas',
      allocatedStorage: 20,
      maxAllocatedStorage: 100,
      storageType: StorageType.GP3,
      multiAz: false,
      publiclyAccessible: false,
      backupRetention: Duration.days(7),
      deleteAutomatedBackups: true,
      deletionProtection: false,
      removalPolicy: RemovalPolicy.SNAPSHOT,
    });

    this.secret = this.instance.secret!;
  }
}
