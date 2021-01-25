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
import { spawn } from 'child_process'

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
	// Prepare the output directory
	const outDir = path.resolve(rootDir, 'dist', 'lambdas')
	try {
		await fs.stat(outDir)
	} catch (_) {
		await fs.mkdir(outDir)
	}
	const sourceCodeBucketName = await getLambdaSourceCodeBucketName({
		stackName,
	})

	// Pack the baselayer, only with needed dependencies

	// - This will contain the package.json to be used for the layer
	const layerFolder = path.resolve(
		rootDir,
		'dist',
		'lambdas',
		'cloudFormationLayer',
	)
	try {
		await fs.stat(layerFolder)
	} catch (_) {
		await fs.mkdir(layerFolder)
	}

	// - Pick relevant dependencies from the project's package.json
	//   so it they have the right version
	const { dependencies } = JSON.parse(
		await fs.readFile(path.resolve(rootDir, 'package.json'), 'utf-8'),
	)
	const cdkLambdaDeps = {
		'@aws-sdk/client-s3': dependencies['@aws-sdk/client-s3'],
	}
	if (Object.values(cdkLambdaDeps).find((v) => v === undefined) !== undefined) {
		throw new Error(
			`Could not resolve all dependencies in "${JSON.stringify(
				cdkLambdaDeps,
			)}"`!,
		)
	}
	// - add them to the layers package.json
	await fs.writeFile(
		path.join(layerFolder, 'package.json'),
		JSON.stringify({
			dependencies: cdkLambdaDeps,
		}),
		'utf-8',
	)
	// - install them
	await new Promise<void>((resolve, reject) => {
		const p = spawn('npm', ['i', '--ignore-scripts', '--only=prod'], {
			cwd: layerFolder,
		})
		p.on('close', (code) => {
			if (code !== 0) {
				const msg = `[CloudFormation Layer] npm i in ${layerFolder} exited with code ${code}.`
				return reject(new Error(msg))
			}
			return resolve()
		})
	})
	const baseLayerZipFileName = await packBaseLayer({
		srcDir: layerFolder,
		outDir,
		Bucket: sourceCodeBucketName,
	})

	// Pack the lambda
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
