import * as path from 'path'
import * as fs from 'fs'
import { S3 } from 'aws-sdk'
import { promisify } from 'util'

const s3 = new S3()
const writeFile = promisify(fs.writeFile)

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
		fs.statSync(awsLockFile)
		return true
	} catch (_) {
		try {
			const res = await s3
				.headObject({
					Bucket,
					Key,
				})
				.promise()
			await writeFile(awsLockFile, JSON.stringify(res), 'utf-8')
			return true // File exists
		} catch (err) {
			return false
		}
	}
}
