import * as chalk from 'chalk'
import ansiEscapes from 'ansi-escapes'
const Table = require('cli-table')

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

const color = {
	progress: chalk.gray,
	success: chalk.green.dim,
	failure: chalk.red,
}

const onScreen = () => {
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

const draw = (title: string, writer: (out: string) => void) => {
	return (items: Map<string, Status>) => {
		const table = new Table({
			head: [
				chalk.yellow.bold(title),
				...['Time', 'Info', 'Status'].map(s => chalk.yellow.dim(s)),
			],
			colAligns: ['left', 'right', 'left', 'left'],
		})
		items.forEach(({ status, message, startTime, info }, id) => {
			table.push([
				color[status](id),
				chalk.grey(`${Date.now() - startTime.getTime()}ms`),
				(info || ['-']).map(i => chalk.blue(i)).join(' '),
				color[status](message),
			])
		})
		writer(table.toString())
	}
}

export const ConsoleProgressReporter = (title: string): ProgressReporter => {
	const items = new Map<string, Status>()
	const d = draw(title, onScreen())

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
