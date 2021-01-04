import {
	CloudFormationClient,
	DescribeStacksCommand,
} from '@aws-sdk/client-cloudformation'
import { LambdaSourceCodeStorageStack } from './LambdaSourceCodeStorageStack'

const cf = new CloudFormationClient({})

export const getLambdaSourceCodeBucketName = async ({
	stackName,
}: {
	stackName: string
}): Promise<string> =>
	cf
		.send(
			new DescribeStacksCommand({
				StackName: LambdaSourceCodeStorageStack.stackName({ stackName }),
			}),
		)
		.then(({ Stacks }) => {
			if (Stacks === undefined || !Stacks.length) {
				throw new Error(
					`${LambdaSourceCodeStorageStack.stackName({
						stackName,
					})} stack is not available.`,
				)
			} else {
				const stack = Stacks[0]
				const BucketOutput = stack.Outputs?.find(
					({ OutputKey }) => OutputKey === 'bucketName',
				)
				if (
					BucketOutput === undefined ||
					BucketOutput.OutputValue === undefined
				) {
					throw new Error(
						`${LambdaSourceCodeStorageStack.stackName({
							stackName,
						})} bucket not found.`,
					)
				}
				return BucketOutput.OutputValue
			}
		})
