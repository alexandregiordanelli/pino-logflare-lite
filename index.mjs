import { sendLogBackEnd } from './utils.mjs';
import build from 'pino-abstract-transport';

export default async function(fetch, logflare) {
	return build(async function (source) {
		for await (const obj of source) {
			await sendLogBackEnd(fetch, logflare, obj)
		}
	});
}
