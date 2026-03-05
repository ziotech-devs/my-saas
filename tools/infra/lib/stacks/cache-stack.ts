import { Stack, type StackProps } from 'aws-cdk-lib';
import { type ISecurityGroup, type IVpc, SubnetType } from 'aws-cdk-lib/aws-ec2';
import { CfnSubnetGroup, CfnCacheCluster } from 'aws-cdk-lib/aws-elasticache';
import type { Construct } from 'constructs';

export type CacheStackProps = StackProps & {
  vpc: IVpc;
  securityGroup: ISecurityGroup;
};

export class CacheStack extends Stack {
  public readonly redisEndpoint: string;
  public readonly redisPort: string;

  constructor(scope: Construct, id: string, props: CacheStackProps) {
    super(scope, id, props);

    const { vpc, securityGroup } = props;

    const privateSubnetIds = vpc
      .selectSubnets({ subnetType: SubnetType.PRIVATE_WITH_EGRESS })
      .subnetIds;

    const subnetGroup = new CfnSubnetGroup(this, 'RedisSubnetGroup', {
      description: 'Subnet group for LangGraph Redis',
      subnetIds: privateSubnetIds,
      cacheSubnetGroupName: 'my-saas-redis-subnet-group',
    });

    const redisCluster = new CfnCacheCluster(this, 'RedisCluster', {
      clusterName: 'my-saas-redis',
      engine: 'redis',
      cacheNodeType: 'cache.t3.micro',
      numCacheNodes: 1,
      cacheSubnetGroupName: subnetGroup.ref,
      vpcSecurityGroupIds: [securityGroup.securityGroupId],
    });

    redisCluster.addDependency(subnetGroup);

    this.redisEndpoint = redisCluster.attrRedisEndpointAddress;
    this.redisPort = redisCluster.attrRedisEndpointPort;
  }
}
