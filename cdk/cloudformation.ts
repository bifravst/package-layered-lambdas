import { TestApp } from './TestApp'
import * as path from 'path'
import { promises as fs } from 'fs'
import { getLambdaSourceCodeBucketName } from './getLambdaSourceCodeBucketName'
import { TestStackLambdas } from './TestStack'
import { packBaseLayer, packLayeredLambdas, WebpackMode } from '../src'

const stackName = process.env.STACK_NAME

if (!stackName) {
	console.error(`STACK_NAME not set!`)
	process.exit(1)
}

const prepareResources = async ({
	stackName,
	rootDir,
}: {
	stackName: string
	rootDir: string
}) => {
	// Pack the lambdas
	const outDir = path.resolve(rootDir, 'dist', 'lambdas')
	try {
		await fs.stat(outDir)
	} catch (_) {
		await fs.mkdir(outDir)
	}
	const sourceCodeBucketName = await getLambdaSourceCodeBucketName({
		stackName,
	})
	const baseLayerZipFileName = await packBaseLayer({
		srcDir: rootDir,
		outDir,
		Bucket: sourceCodeBucketName,
	})
	const lambdas = await packLayeredLambdas<TestStackLambdas>({
		id: 'test-lambdas',
		mode: WebpackMode.production,
		srcDir: rootDir,
		outDir,
		Bucket: sourceCodeBucketName,
		lambdas: {
			uuid: path.resolve(rootDir, 'test', 'uuidLambda.ts'),
		},
		tsConfig: path.resolve(rootDir, 'tsconfig.json'),
	})

	return {
		sourceCodeBucketName,
		baseLayerZipFileName,
		lambdas,
	}
}

prepareResources({
	stackName,
	rootDir: process.cwd(),
})
	.then((args) =>
		new TestApp({
			stackName,
			...args,
		}).synth(),
	)
	.catch((err) => {
		console.error(err)
		process.exit(1)
	})
