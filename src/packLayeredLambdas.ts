import { packLambda, WebpackMode } from './packLambda'
import { ConsoleProgressReporter } from './reporter'

export type LayeredLambdas<A extends { [key: string]: string }> = {
	id: string
	lambdaZipFileNames: A
}

export const packLayeredLambdas = async <
	A extends { [key: string]: string }
>(args: {
	id: string
	mode: WebpackMode
	tsConfig: string
	srcDir: string
	outDir: string
	Bucket: string
	lambdas: A
	ignoreFolders?: string[]
}): Promise<LayeredLambdas<A>> => {
	const r = ConsoleProgressReporter('Lambdas')
	const packs = await Promise.all(
		Object.keys(args.lambdas).map(async lambda =>
			packLambda({
				...args,
				name: lambda,
				src: args.lambdas[lambda],
				reporter: r,
			}),
		),
	)

	return {
		id: args.id,
		lambdaZipFileNames: packs.reduce(
			(zipFileNames, { name, zipFileName }) => ({
				...zipFileNames,
				[name]: zipFileName,
			}),
			{} as A,
		),
	}
}
