import { App } from '@aws-cdk/core'
import { TestStack, TestStackLambdas } from './TestStack'
import { LayeredLambdas } from '../src'

export class TestApp extends App {
	public constructor(args: {
		stackName: string
		sourceCodeBucketName: string
		baseLayerZipFileName: string
		lambdas: LayeredLambdas<TestStackLambdas>
	}) {
		super()
		new TestStack(this, args.stackName, {
			...args,
		})
	}
}
