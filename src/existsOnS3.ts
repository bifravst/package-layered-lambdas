import * as path from 'path'
import { promises as fs, statSync } from 'fs'
import { S3 } from 'aws-sdk'

const s3 = new S3()

/**
 * Checks whether the file exists on S3
 */
export const existsOnS3 = async (
	Bucket: string,
	Key: string,
	outDir: string,
): Promise<boolean> => {
	const awsLockFile = path.resolve(outDir, `${Bucket}.${Key}.aws.json`)
	try {
		statSync(awsLockFile)
		return true
	} catch (_) {
		try {
			const res = await s3
				.headObject({
					Bucket,
					Key,
				})
				.promise()
			await fs.writeFile(awsLockFile, JSON.stringify(res), 'utf-8')
			return true // File exists
		} catch (err) {
			return false
		}
	}
}
