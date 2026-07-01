import pino from 'pino';
import pretty from 'pino-pretty';

// TODO: Log rotation (rotate every day into files)
const streams = [
	{
		// Console output
		level: 'info',
		stream: pretty({
			customPrettifiers: {
				time: timestamp => `[${Temporal.Now.plainDateISO()} ${timestamp}]`,
			},
		}),
	},
	{
		// Console output
		level: 'error',
		stream: pretty({
			customPrettifiers: {
				time: timestamp => `[${Temporal.Now.plainDateISO()} ${timestamp}]`,
			},
		}),
	},
	{
		// File output
		level: 'info',
		stream: pretty({
			colorize: false,
			destination: './info.log',
			customPrettifiers: {
				time: timestamp => `[${Temporal.Now.plainDateISO()} ${timestamp}]`,
			},
		}),
	},
	{
		// File output
		level: 'error',
		stream: pretty({
			colorize: false,
			destination: './error.log',
			customPrettifiers: {
				time: timestamp => `[${Temporal.Now.plainDateISO()} ${timestamp}]`,
			},
		}),
	},
];

export default pino(
	{
		level: 'info',
	},
	pino.multistream(streams, {
		dedupe: true,
	}),
);