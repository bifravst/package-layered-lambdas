import { CloudFormation, Lambda } from 'aws-sdk'
import { stackOutput } from '@bifravst/cloudformation-helpers'
import { strict as assert } from 'assert'

const cf = new CloudFormation()
const so = stackOutput(cf)
const λ = new Lambda()

so<{ uuidLambdaName: string }>(process.env.STACK_NAME || '')
	.then(async ({ uuidLambdaName }) =>
		λ
			.invoke({
				FunctionName: uuidLambdaName,
			})
			.promise(),
	)
	.then(({ Payload }) => {
		const { statusCode, body } = JSON.parse(Payload as string)
		assert.equal(statusCode, 200, 'Status code should be 200')
		assert.match(
			body,
			/^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i,
			'Body should be a v4 UUID',
		)
	})
	.catch((err) => {
		console.error(err)
		process.exit(1)
	})
