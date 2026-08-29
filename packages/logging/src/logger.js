const DEFAULT_DISCORD_ENDPOINT = process.env.BEEVOLT_DISCORD_LOG_URL || '';

export const LOG_TYPE = Object.freeze({
    error: 1,
    warn: 2,
    debug: 3
});

function timestamp() {
    return new Date().toLocaleTimeString();
}

function formatLine(level, tag, msg) {
    const normalizedTag = tag || 'LOG';
    return `(${timestamp()}) ${level.toUpperCase()}: [ ${normalizedTag} ] ${msg}`;
}

function normalizeLevelName(logType) {
    switch (logType) {
        case LOG_TYPE.error:
        case 'error':
            return 'error';
        case LOG_TYPE.warn:
        case 'warn':
            return 'warn';
        case LOG_TYPE.debug:
        case 'debug':
        default:
            return 'debug';
    }
}

export function SendConsoleErr(tag, msg) {
    console.error(formatLine('error', tag, msg));
}

export function SendConsoleWarn(tag, msg) {
    console.warn(formatLine('warn', tag, msg));
}

export function SendConsoleDebug(tag, msg) {
    console.log(formatLine('debug', tag, msg));
}

export function SendConsoleLog(logType, tag, msg) {
    switch (normalizeLevelName(logType)) {
        case 'error':
            return SendConsoleErr(tag, msg);
        case 'warn':
            return SendConsoleWarn(tag, msg);
        case 'debug':
        default:
            return SendConsoleDebug(tag, msg);
    }
}

async function postJson(url, body) {
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        return response.ok;
    } catch (error) {
        SendConsoleWarn('LOGS', `Não foi possível enviar o log remoto: ${error.message}`);
        return false;
    }
}

export function createLogger(options = {}) {
    const discordEndpoint = options.discordEndpoint ?? DEFAULT_DISCORD_ENDPOINT;

    return {
        info(tag, msg) {
            SendConsoleDebug(tag, msg);
        },
        warn(tag, msg) {
            SendConsoleWarn(tag, msg);
        },
        error(tag, msg) {
            SendConsoleErr(tag, msg);
        },
        debug(tag, msg) {
            SendConsoleDebug(tag, msg);
        },
        async discord(type, payload) {
            if (!discordEndpoint) {
                return false;
            }

            return postJson(discordEndpoint, {
                type,
                ...payload,
                timestamp: new Date().toISOString()
            });
        }
    };
}

export async function SendDiscordLog(logType, msg, options = {}) {
    const discordEndpoint = options.endpoint ?? DEFAULT_DISCORD_ENDPOINT;

    if (!discordEndpoint) {
        return false;
    }

    return postJson(discordEndpoint, {
        type: normalizeLevelName(logType),
        message: msg,
        tag: options.tag || 'LOG'
    });
}
