import * as CloudFormation from '@aws-cdk/core'
import * as Lambda from '@aws-cdk/aws-lambda'
import * as IAM from '@aws-cdk/aws-iam'
import * as S3 from '@aws-cdk/aws-s3'
import * as CloudWatchLogs from '@aws-cdk/aws-logs'
import { LayeredLambdas } from '../src'

export type TestStackLambdas = {
	uuid: string
}

export class TestStack extends CloudFormation.Stack {
	public constructor(
		parent: CloudFormation.App,
		id: string,
		{
			sourceCodeBucketName,
			baseLayerZipFileName,
			lambdas,
		}: {
			sourceCodeBucketName: string
			baseLayerZipFileName: string
			lambdas: LayeredLambdas<TestStackLambdas>
		},
	) {
		super(parent, id)

		const sourceCodeBucket = S3.Bucket.fromBucketAttributes(
			this,
			'SourceCodeBucket',
			{
				bucketName: sourceCodeBucketName,
			},
		)

		const baseLayer = new Lambda.LayerVersion(this, `${id}-layer`, {
			code: Lambda.Code.bucket(sourceCodeBucket, baseLayerZipFileName),
			compatibleRuntimes: [Lambda.Runtime.NODEJS_12_X],
		})

		const uuidLambda = new Lambda.Function(this, 'uuidLambda', {
			code: Lambda.Code.bucket(
				sourceCodeBucket,
				lambdas.lambdaZipFileNames.uuid,
			),
			layers: [baseLayer],
			description: 'Returns a v4 UUID',
			handler: 'index.handler',
			runtime: Lambda.Runtime.NODEJS_12_X,
			timeout: CloudFormation.Duration.seconds(15),
			initialPolicy: [
				new IAM.PolicyStatement({
					resources: ['*'],
					actions: [
						'logs:CreateLogGroup',
						'logs:CreateLogStream',
						'logs:PutLogEvents',
					],
				}),
			],
		})

		new CloudFormation.CfnOutput(this, 'uuidLambdaName', {
			value: uuidLambda.functionName,
			exportName: `${this.stackName}:uuidLambdaName`,
		})

		new CloudWatchLogs.LogGroup(this, 'uuidLambdaLogGroup', {
			removalPolicy: CloudFormation.RemovalPolicy.DESTROY,
			logGroupName: `/aws/lambda/${uuidLambda.functionName}`,
			retention: CloudWatchLogs.RetentionDays.ONE_DAY,
		})
	}
}
