import { RemovalPolicy, Stack, type StackProps } from 'aws-cdk-lib';
import { Repository, TagMutability } from 'aws-cdk-lib/aws-ecr';
import type { Construct } from 'constructs';

export type EcrStackProps = StackProps;

export class EcrStack extends Stack {
  public readonly apiRepository: Repository;

  constructor(scope: Construct, id: string, props?: EcrStackProps) {
    super(scope, id, props);

    this.apiRepository = new Repository(this, 'ApiRepository', {
      repositoryName: 'my-saas-api',
      imageTagMutability: TagMutability.MUTABLE,
      removalPolicy: RemovalPolicy.RETAIN,
      lifecycleRules: [
        {
          maxImageCount: 10,
          description: 'Keep only the last 10 images',
        },
      ],
    });
  }
}
