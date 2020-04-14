import * as path from 'path'
import { promises as fs } from 'fs'
import { S3 } from 'aws-sdk'

const s3 = new S3()

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
			const res = await s3
				.headObject({
					Bucket,
					Key,
				})
				.promise()
			await fs.writeFile(awsLockFile, JSON.stringify(res), 'utf-8')
			return res.ContentLength as number // File exists
		} catch (err) {
			return 0
		}
	}
}
