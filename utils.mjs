function isObject(value) {
	return typeof value === 'object' && value !== null;
}

function isString(value) {
	return typeof value === 'string';
}

function levelToStatus(level) {
	if (level === 10 || level === 20) {
		return 'debug';
	}
	if (level === 40) {
		return 'warning';
	}
	if (level === 50) {
		return 'error';
	}
	if (level >= 60) {
		return 'critical';
	}
	return 'info';
}


function removeFalsy(input) {
	if (input === null || input === undefined) {
		return input;
	}

	if (typeof input === 'object' && input !== null) {
		let key;

		for (key in input) {
			const value = input[key];

			if (!value) {
				delete input[key];
			} else if (typeof value === 'object') {
				removeFalsy(value);

				if (!Object.keys(value).length) {
					delete input[key];
				}
			}
		}
	}

	return input;
}

function prepareLogBackEnd(item) {
	const status = levelToStatus(item.level);
	const message = item.msg || status;
	const host = item.hostname;
	const service = item.service;
	const pid = item.pid;
	const stack = item.stack;
	const type = item.type;
	const timestamp = item.time || new Date().getTime();

	const {
		time: _time,
		level: _level,
		msg: _msg,
		hostname: _hostname,
		service: _service,
		pid: _pid,
		stack: _stack,
		type: _type,
		...cleanedItem
	} = item;
	const context = removeFalsy({ host, service, pid, stack, type });
	return {
		metadata: {
			...cleanedItem,
			context,
			level: status
		},
		message,
		timestamp
	};
}

function prepareLogFrontEnd(logEvent) {
	const {
		ts,
		messages,
		bindings,
		level: { value: levelValue }
	} = logEvent;
	const level = levelToStatus(levelValue);
	const timestamp = ts;
	const objMessages = messages.filter(isObject);
	const strMessages = messages.filter(isString);
	const logEntry = strMessages.join(' ');
	const defaultMetadata = {
		url: window.document.URL,
		level: level,
		browser: true
	};
	const bindingsAndMessages = bindings.concat(objMessages);
	const metadata = bindingsAndMessages.reduce((acc, el) => {
		return Object.assign(acc, el);
	}, defaultMetadata);

	return {
		metadata,
		log_entry: logEntry,
		timestamp
	};
};

async function postLogEvents(fetch, logflare, logEvent) {
	const batch = Array.isArray(logEvent) ? logEvent : [logEvent];

	try {
		const response = await fetch(
			`https://api.logflare.app/logs?api_key=${logflare.apiKey}&source=${logflare.sourceToken}`,
			{
				body: JSON.stringify({
					batch
				}),
				method: 'POST',
				headers: {
					Accept: 'application/json, text/plain, */*',
					'Content-Type': 'application/json'
				}
			}
		);

		const data = await response.json();
		console.log(data);
	} catch (e) {
		console.log(e);
	}
}

export async function sendLogBackEnd(fetch, logflare, obj){
    return postLogEvents(fetch, logflare, prepareLogBackEnd(obj))
}

export async function sendLogFrontEnd(fetch, logflare, obj){
    return postLogEvents(fetch, logflare, prepareLogFrontEnd(obj))
}