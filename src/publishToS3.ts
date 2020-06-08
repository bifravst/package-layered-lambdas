import { promises as fs } from 'fs'
import { S3 } from 'aws-sdk'

const s3 = new S3()

/**
 * Publishes the file to S3
 */
export const publishToS3 = async (
	Bucket: string,
	Key: string,
	location: string,
): Promise<void> => {
	const Body = await fs.readFile(location)
	await s3.putObject({ Body, Bucket, Key }).promise()
}
