import * as path from 'path'
import * as fs from 'fs'
import * as yazl from 'yazl'
import { checkSumOfFiles } from './checkSum'
import * as glob from 'glob'
import { spawn } from 'child_process'
import { dirSync } from 'tmp'
import { existsOnS3 } from './existsOnS3'
import { publishToS3 } from './publishToS3'
import { ProgressReporter, ConsoleProgressReporter } from './reporter'

/**
 * Packs a base layer for use with the lambdas with all the dependencies and uploads it to S3
 */
export const packBaseLayer = async ({
	srcDir,
	outDir,
	Bucket,
	reporter,
	layerName,
}: {
	srcDir: string
	outDir: string
	Bucket: string
	reporter?: ProgressReporter
	layerName?: string
}): Promise<string> => {
	const lockFile = path.resolve(srcDir, 'package-lock.json')
	const hash = (await checkSumOfFiles([lockFile])).checksum

	const name = `${layerName ?? 'base-layer'}-${hash}`
	const zipFilenameWithHash = `${name}.zip`
	const localPath = path.resolve(outDir, zipFilenameWithHash)

	const r = reporter || ConsoleProgressReporter('Base Layer')
	const progress = r.progress(name)
	const success = r.success(name)
	const failure = r.failure(name)
	const sizeInBytes = r.sizeInBytes(name)

	// Check if it already has been built and published
	progress('Checking S3 cache')
	let fileSize = await existsOnS3(Bucket, zipFilenameWithHash, outDir)
	if (fileSize) {
		success('Done')
		sizeInBytes(fileSize)
		return zipFilenameWithHash
	}

	// Check if it already has been built locally
	try {
		progress('Checking local file')
		const { size } = fs.statSync(localPath)
		sizeInBytes(size)
		// File exists
		progress('Publishing to S3', `-> ${Bucket}`)
		await publishToS3(Bucket, zipFilenameWithHash, localPath)
		await existsOnS3(Bucket, zipFilenameWithHash, outDir)
		success('Done')
		return zipFilenameWithHash
	} catch {
		// Pass
	}

	// Check if file exists on S3
	progress('Checking S3 cache')
	fileSize = await existsOnS3(Bucket, zipFilenameWithHash, outDir)
	if (fileSize) {
		success('Done')
		sizeInBytes(fileSize)
		return zipFilenameWithHash
	}

	progress('Packing base layer')

	const tempDir = dirSync({ unsafeCleanup: false }).name
	const installDir = `${tempDir}${path.sep}nodejs`
	fs.mkdirSync(installDir)
	fs.copyFileSync(lockFile, `${installDir}${path.sep}package-lock.json`)
	fs.copyFileSync(
		path.resolve(srcDir, 'package.json'),
		`${installDir}${path.sep}package.json`,
	)

	await new Promise((resolve, reject) => {
		progress('Installing dependencies')
		const p = spawn('npm', ['ci', '--ignore-scripts', '--only=prod'], {
			cwd: installDir,
		})
		p.on('close', (code) => {
			if (code !== 0) {
				const msg = `npm i in ${installDir} exited with code ${code}.`
				failure(msg)
				return reject(new Error(msg))
			}
			success('Dependencies installed')
			return resolve()
		})
		p.stdout.on('data', (data) => {
			progress('Installing dependencies:', data.toString())
		})
		p.stderr.on('data', (data) => {
			progress('Installing dependencies:', data.toString())
		})
	})

	await new Promise((resolve) => {
		progress('Creating archive')
		const zipfile = new yazl.ZipFile()
		const files = glob.sync(`${tempDir}${path.sep}**${path.sep}*`)
		files.forEach((file) => {
			if (fs.statSync(file).isFile()) {
				zipfile.addFile(file, file.replace(`${tempDir}${path.sep}`, ''))
			}
		})
		zipfile.outputStream
			.pipe(fs.createWriteStream(localPath))
			.on('close', () => {
				success(
					'Layer packed',
					`${Math.round(fs.statSync(localPath).size / 1024)}KB`,
				)
				resolve()
			})
		zipfile.end()
	})

	progress('Publishing to S3', `-> ${Bucket}`)
	await publishToS3(Bucket, zipFilenameWithHash, localPath)
	fileSize = await existsOnS3(Bucket, zipFilenameWithHash, outDir)
	sizeInBytes(fileSize)
	success('All done')

	return zipFilenameWithHash
}
