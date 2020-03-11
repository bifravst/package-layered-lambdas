import * as chalk from 'chalk'
import ansiEscapes from 'ansi-escapes'
import { table } from 'table'

export type ProgressReporter = {
	progress: (id: string) => (message: string, ...info: string[]) => void
	success: (id: string) => (message: string, ...info: string[]) => void
	failure: (id: string) => (message: string, ...info: string[]) => void
}

type Status = {
	status: 'progress' | 'success' | 'failure'
	message: string
	info?: string[]
	startTime: Date
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
	return (items: Map<string, Status>) => {
		screenWriter(
			table(
				[
					[
						chalk.yellow.bold(title),
						...['Time', 'Status', 'Info'].map(s => chalk.yellow.dim(s)),
					],
					...Array.from(items, ([id, { status, message, startTime, info }]) => [
						color[status](id),
						chalk.grey(`${Date.now() - startTime.getTime()}ms`),
						color[status](message),
						(info || ['-']).map(i => chalk.blue(i)).join(' '),
					]),
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
							alignment: 'left',
						},
						3: {
							alignment: 'center',
						},
					},
					drawHorizontalLine: (index, size) => {
						return index === 0 || index === 1 || index === size
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
	const items = new Map<string, Status>()
	return {
		progress: (id: string) => (message: string, ...info: string[]) => {
			items.set(id, {
				status: 'progress',
				message,
				info,
				startTime: new Date(),
			})
			d(items)
		},
		success: (id: string) => (message: string, ...info: string[]) => {
			items.set(id, {
				status: 'success',
				message,
				info,
				startTime: new Date(),
			})
			d(items)
		},
		failure: (id: string) => (message: string, ...info: string[]) => {
			items.set(id, {
				status: 'failure',
				message,
				info,
				startTime: new Date(),
			})
			d(items)
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
})

export const ConsoleProgressReporter = (
	title: string,
	ci = process.env.CI,
): ProgressReporter => (ci ? onCI() : onScreen(title))
