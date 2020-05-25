import { LambdaSourceCodeStorageApp } from './LambdaSourceCodeStorageApp'
import { LambdaSourceCodeStorageStack } from './LambdaSourceCodeStorageStack'

const stackName = process.env.STACK_NAME

if (!stackName) {
	console.error(`STACK_NAME not set!`)
	process.exit(1)
}

new LambdaSourceCodeStorageApp({
	stackName: LambdaSourceCodeStorageStack.stackName({ stackName }),
}).synth()
