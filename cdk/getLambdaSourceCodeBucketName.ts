import { CloudFormation } from 'aws-sdk'
import { LambdaSourceCodeStorageStack } from './LambdaSourceCodeStorageStack'

const cf = new CloudFormation()

export const getLambdaSourceCodeBucketName = async ({
	stackName,
}: {
	stackName: string
}): Promise<string> =>
	cf
		.describeStacks({
			StackName: LambdaSourceCodeStorageStack.stackName({ stackName }),
		})
		.promise()
		.then(({ Stacks }) => {
			if (Stacks === undefined || !Stacks.length) {
				throw new Error(
					`${LambdaSourceCodeStorageStack.stackName({
						stackName,
					})} stack is not available.`,
				)
			} else {
				const stack = Stacks[0]
				const BucketOutput =
					stack.Outputs &&
					stack.Outputs.find(({ OutputKey }) => OutputKey === 'bucketName')
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