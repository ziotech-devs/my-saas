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

export type GraphsDatabaseStackProps = StackProps & {
  vpc: IVpc;
  securityGroup: ISecurityGroup;
};

export class GraphsDatabaseStack extends Stack {
  public readonly instance: DatabaseInstance;
  public readonly secret: ISecret;

  constructor(scope: Construct, id: string, props: GraphsDatabaseStackProps) {
    super(scope, id, props);

    const { vpc, securityGroup } = props;

    this.instance = new DatabaseInstance(this, 'GraphsPostgresInstance', {
      instanceIdentifier: 'my-saas-graphs-db',
      engine: DatabaseInstanceEngine.postgres({
        version: PostgresEngineVersion.VER_16_4,
      }),
      instanceType: InstanceType.of(InstanceClass.T3, InstanceSize.MICRO),
      vpc,
      vpcSubnets: {
        subnetType: SubnetType.PRIVATE_WITH_EGRESS,
      },
      securityGroups: [securityGroup],
      credentials: Credentials.fromGeneratedSecret('postgres', {
        secretName: 'my-saas/graphs-database-credentials',
      }),
      databaseName: 'langgraph',
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
