import { SendConsoleErr, SendConsoleWarn } from '@beevolt/logging';
import { sendChannelContainer } from '../lib/container-message.js';

const LOG_ASSETS = {
    error: {
        title: '### :red_circle: ERRO',
        color: 0xFF5555,
        avatar: 'https://drive.google.com/uc?export=download&id=1N11iay7wbvTet_AhV6FPybiX8kqf8K8x'
    },
    warn: {
        title: '### :warning: AVISO',
        color: 0xFFFF55,
        avatar: 'https://drive.google.com/uc?export=download&id=1Do4Npt3aJICYS09JFgGC70zH5rfM5DYu'
    },
    debug: {
        title: '### :white_check_mark: DEBUG',
        color: 0x55FF55,
        avatar: 'https://drive.google.com/uc?export=download&id=1wNikRRHliZMt9Vijc2MBfT0gCCQxMYGa'
    }
};

function normalizeLevel(type) {
    if (type === 1 || type === 'error') {
        return 'error';
    }

    if (type === 2 || type === 'warn') {
        return 'warn';
    }

    if (type === 3 || type === 'debug') {
        return 'debug';
    }

    return 'debug';
}

export function registerInternalRoutes(app, { client, channelId }) {
    app.post('/internal/log', async (req, res) => {
        try {
            if (!channelId) {
                return res.status(500).json({
                    success: false,
                    message: 'Canal de log não configurado.'
                });
            }

            if (!client.isReady()) {
                return res.status(503).json({
                    success: false,
                    message: 'Bot ainda não está pronto.'
                });
            }

            const level = normalizeLevel(req.body?.type);
            const asset = LOG_ASSETS[level];
            const message = req.body?.message || 'Mensagem de log sem conteúdo.';
            const tag = req.body?.tag || 'LOG';

            const channel = await client.channels.fetch(channelId);

            await sendChannelContainer(channel, {
                title: asset.title,
                avatar: asset.avatar,
                color: asset.color,
                message: `\`${tag}\`\n\n${message}`
            });

            return res.sendStatus(200);
        } catch (error) {
            SendConsoleWarn('ROTAS', 'Erro na rota internal/log');
            SendConsoleErr('ROTAS', error?.message || String(error));

            return res.status(500).json({
                success: false,
                message: 'Falha ao publicar o log no Discord.'
            });
        }
    });
}
