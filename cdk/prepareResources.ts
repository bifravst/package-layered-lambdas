import * as path from 'path'
import { promises as fs } from 'fs'
import { getLambdaSourceCodeBucketName } from './getLambdaSourceCodeBucketName'
import { TestStackLambdas } from './TestStack'
import {
	packBaseLayer,
	packLayeredLambdas,
	WebpackMode,
	LayeredLambdas,
} from '../src'

export const prepareResources = async ({
	stackName,
	rootDir,
}: {
	stackName: string
	rootDir: string
}): Promise<{
	sourceCodeBucketName: string
	baseLayerZipFileName: string
	lambdas: LayeredLambdas<TestStackLambdas>
}> => {
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
