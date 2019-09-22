import chalk from 'chalk'
import * as fs from 'fs'
import { S3 } from 'aws-sdk'
import { promisify } from 'util'

const s3 = new S3()
const readFile = promisify(fs.readFile)

/**
 * Publishes the file to S3
 */
export const publishToS3 = async (
	Bucket: string,
	Key: string,
	location: string,
) => {
	const Body = await readFile(location)
	console.error(
		chalk.gray(
			`Uploading to S3: ${chalk.cyan(Key)} -> ${chalk.yellow(Bucket)}`,
		),
	)
	return s3.putObject({ Body, Bucket, Key }).promise()
}
