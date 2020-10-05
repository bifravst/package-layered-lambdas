import * as chalk from 'chalk'
import ansiEscapes from 'ansi-escapes'
import { table } from 'table'

export type ProgressReporter = {
	progress: (id: string) => (message: string, ...info: string[]) => void
	success: (id: string) => (message: string, ...info: string[]) => void
	sizeInBytes: (id: string) => (size: number) => void
	failure: (id: string) => (message: string, ...info: string[]) => void
}

type Status = {
	status: 'progress' | 'success' | 'failure'
	message: string
	info?: string[]
	updated: Date
}

/**
 * Writes the output to the screen, while overwriting previous outputs.
 * This is useful for interactive shells.
 */
const redrawingWriter = () => {
	let lastLines = 0
	return (out: string) => {
		if (lastLines > 0) {
			for (let i = 0; i < lastLines; i++) {
				process.stdout.write(ansiEscapes.cursorUp(1))
				process.stdout.write(ansiEscapes.eraseLine)
			}
		}
		process.stdout.write(ansiEscapes.cursorSavePosition)
		process.stdout.write(out.trim())
		process.stdout.write('\n')
		lastLines = out.trim().split('\n').length
	}
}

const tableWriter = (title: string) => {
	const screenWriter = redrawingWriter()
	const color = {
		progress: chalk.gray,
		success: chalk.green.dim,
		failure: chalk.red,
	}
	return (
		items: Record<string, Status>,
		startTimes: Record<string, Date>,
		sizesInBytes: Record<string, number>,
	) => {
		screenWriter(
			table(
				[
					[
						chalk.yellow.bold(title),
						...['Time', 'Size', 'Status'].map((s) => chalk.yellow.dim(s)),
					],
					...Object.entries(items).map(
						([id, { status, message, info, updated }]) => {
							const startTime = startTimes[id]
							const size = sizesInBytes[id]
							return [
								color[status](id) +
									`${
										info && info.length > 0
											? chalk.grey(': ') +
											  info.map((i) => chalk.blue(i)).join(' ')
											: ''
									}`,
								startTime !== undefined
									? chalk.grey(`${updated.getTime() - startTime.getTime()}ms`)
									: chalk.grey.dim('-'),
								size !== undefined
									? chalk.blue(`${Math.round(size / 1024)} KB`)
									: '',
								color[status](message),
							]
						},
					),
					[
						'',
						'',
						chalk.blue.dim(
							`${Math.round(
								Object.values(sizesInBytes).reduce(
									(total, size) => total + size,
									0,
								) / 1024,
							)} KB`,
						),
						'',
					],
				],
				{
					columns: {
						0: {
							alignment: 'left',
						},
						1: {
							alignment: 'right',
						},
						2: {
							alignment: 'right',
						},
						3: {
							alignment: 'left',
						},
					},
					drawHorizontalLine: (index, size) => {
						return (
							index === 0 || index === 1 || index === size - 1 || index === size
						)
					},
					border: Object.entries({
						topBody: `─`,
						topJoin: `┬`,
						topLeft: `┌`,
						topRight: `┐`,

						bottomBody: `─`,
						bottomJoin: `┴`,
						bottomLeft: `└`,
						bottomRight: `┘`,

						bodyLeft: `│`,
						bodyRight: `│`,
						bodyJoin: `│`,

						joinBody: `─`,
						joinLeft: `├`,
						joinRight: `┤`,
						joinJoin: `┼`,
					}).reduce((o, [key, v]) => ({ ...o, [key]: chalk.grey(v) }), {}),
				},
			),
		)
	}
}

const onScreen = (title: string) => {
	const d = tableWriter(title)
	const items = {} as Record<string, Status>
	const startTimes = {} as Record<string, Date>
	const sizesInBytes = {} as Record<string, number>
	const start = (id: string) => {
		if (startTimes[id] === undefined) {
			startTimes[id] = new Date()
		}
	}
	return {
		progress: (id: string) => (message: string, ...info: string[]) => {
			items[id] = {
				status: 'progress',
				message,
				info,
				updated: new Date(),
			}
			start(id)
			d(items, startTimes, sizesInBytes)
		},
		success: (id: string) => (message: string, ...info: string[]) => {
			items[id] = {
				status: 'success',
				message,
				info,
				updated: new Date(),
			}
			start(id)
			d(items, startTimes, sizesInBytes)
		},
		failure: (id: string) => (message: string, ...info: string[]) => {
			items[id] = {
				status: 'failure',
				message,
				info,
				updated: new Date(),
			}
			start(id)
			d(items, startTimes, sizesInBytes)
		},
		sizeInBytes: (id: string) => (size: number) => {
			sizesInBytes[id] = size
			d(items, startTimes, sizesInBytes)
		},
	}
}

const log = (color: chalk.Chalk, brightColor: chalk.Chalk) => (id: string) => (
	message: string,
	...info: string[]
) => {
	console.log(
		chalk.white.dim(`[${new Date().toISOString()}]`),
		color(id),
		brightColor(message),
		...info,
	)
}

const onCI = () => ({
	progress: log(chalk.gray, chalk.gray),
	success: log(chalk.green.dim, chalk.greenBright),
	failure: log(chalk.red, chalk.redBright),
	sizeInBytes: (id: string) => (size: number) =>
		log(chalk.gray, chalk.gray)(id)(`Size: ${Math.round(size / 1024)}KB`),
})

export const ConsoleProgressReporter = (
	title: string,
	ci = process.env.CI,
): ProgressReporter => (ci !== undefined ? onCI() : onScreen(title))
