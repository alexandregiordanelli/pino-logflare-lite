import { sendLogBackEnd } from './utils.mjs';
import build from 'pino-abstract-transport';
import fetch from 'node-fetch';

export default async function(logflare) {
	return build(async function (source) {
		for await (const obj of source) {
			await sendLogBackEnd(fetch, logflare, obj)
		}
	});
}
