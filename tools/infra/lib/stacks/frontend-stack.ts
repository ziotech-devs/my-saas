import { CfnOutput, Duration, RemovalPolicy, Stack, type StackProps } from 'aws-cdk-lib';
import {
  Bucket,
  BucketEncryption,
  BlockPublicAccess,
  ObjectOwnership,
} from 'aws-cdk-lib/aws-s3';
import {
  Distribution,
  ViewerProtocolPolicy,
  CachePolicy,
  AllowedMethods,
  OriginAccessIdentity,
  ErrorResponse,
  PriceClass,
} from 'aws-cdk-lib/aws-cloudfront';
import { S3Origin } from 'aws-cdk-lib/aws-cloudfront-origins';
import type { Construct } from 'constructs';

export type FrontendStackProps = StackProps;

export class FrontendStack extends Stack {
  public readonly bucket: Bucket;
  public readonly distribution: Distribution;
  public readonly distributionUrl: string;

  constructor(scope: Construct, id: string, props?: FrontendStackProps) {
    super(scope, id, props);

    this.bucket = new Bucket(this, 'FrontendBucket', {
      bucketName: `my-saas-frontend-${this.account}-${this.region}`,
      encryption: BucketEncryption.S3_MANAGED,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      objectOwnership: ObjectOwnership.BUCKET_OWNER_ENFORCED,
      versioned: false,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    const originAccessIdentity = new OriginAccessIdentity(
      this,
      'OriginAccessIdentity',
      {
        comment: 'OAI for My SaaS frontend',
      }
    );

    this.bucket.grantRead(originAccessIdentity);

    // CloudFront distribution
    this.distribution = new Distribution(this, 'Distribution', {
      defaultBehavior: {
        origin: new S3Origin(this.bucket, {
          originAccessIdentity,
        }),
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: CachePolicy.CACHING_OPTIMIZED,
        allowedMethods: AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
      },
      defaultRootObject: 'index.html',
      // SPA routing - redirect 403/404 to index.html
      errorResponses: [
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: Duration.minutes(5),
        },
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: Duration.minutes(5),
        },
      ],
      priceClass: PriceClass.PRICE_CLASS_100,
      comment: 'My SaaS Frontend Distribution',
    });

    this.distributionUrl = `https://${this.distribution.distributionDomainName}`;

    // Outputs
    new CfnOutput(this, 'FrontendBucketName', {
      value: this.bucket.bucketName,
      description: 'Frontend S3 bucket name',
    });

    new CfnOutput(this, 'CloudFrontDistributionId', {
      value: this.distribution.distributionId,
      description: 'CloudFront distribution ID',
    });

    new CfnOutput(this, 'CloudFrontUrl', {
      value: this.distributionUrl,
      description: 'CloudFront distribution URL',
    });
  }
}
