import { promises as fs } from 'fs'
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'

const s3 = new S3Client({})

/**
 * Publishes the file to S3
 */
export const publishToS3 = async (
	Bucket: string,
	Key: string,
	location: string,
): Promise<void> => {
	const Body = await fs.readFile(location)
	await s3.send(new PutObjectCommand({ Body, Bucket, Key }))
}
