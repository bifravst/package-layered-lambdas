import * as path from 'path'
import { promises as fs } from 'fs'
import { HeadObjectCommand, S3Client } from '@aws-sdk/client-s3'

const s3 = new S3Client({})

/**
 * Checks whether the file exists on S3
 */
export const existsOnS3 = async (
	Bucket: string,
	Key: string,
	outDir: string,
): Promise<number> => {
	const awsLockFile = path.resolve(outDir, `${Bucket}.${Key}.aws.json`)
	try {
		const info = JSON.parse((await fs.readFile(awsLockFile)).toString())
		return info.ContentLength
	} catch (_) {
		try {
			const res = await s3.send(
				new HeadObjectCommand({
					Bucket,
					Key,
				}),
			)

			await fs.writeFile(awsLockFile, JSON.stringify(res), 'utf-8')
			return res.ContentLength as number // File exists
		} catch (err) {
			return 0
		}
	}
}
