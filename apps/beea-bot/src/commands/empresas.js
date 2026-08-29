import { SlashCommandBuilder } from 'discord.js';

import { db } from '@beevolt/database';
import { replyWithContainer } from '../lib/container-message.js';

const BEEA_ERROR_URL = 'https://drive.google.com/uc?export=download&id=1N11iay7wbvTet_AhV6FPybiX8kqf8K8x';
const BEEA_WARN_URL = 'https://drive.google.com/uc?export=download&id=1Do4Npt3aJICYS09JFgGC70zH5rfM5DYu';

export default {
    data: new SlashCommandBuilder()
        .setName('empresas')
        .setDescription('Visualizar empresas cadastradas.'),

    async execute(interaction) {
        const userData = await db.get(
            'SELECT name FROM employees WHERE discord_uid = ? LIMIT 1',
            [interaction.user.id]
        );

        if (!userData) {
            return replyWithContainer(interaction, {
                title: '### :red_circle: ERRO',
                avatar: BEEA_ERROR_URL,
                color: 0xFF5555,
                message: '```Você não possuí cadastro no banco de dados!```'
            });
        }

        const companies = await db.all(
            'SELECT name FROM companies WHERE subscribers = ? ORDER BY name ASC',
            [userData.name]
        );

        if (companies.length === 0) {
            return replyWithContainer(interaction, {
                title: '### :warning: AVISO',
                avatar: BEEA_WARN_URL,
                color: 0xFF5555,
                message: '```Você não possuí empresas cadastradas!```'
            });
        }

        const message = companies
            .map((company, index) => `\`${index + 1}.\` ${company.name}`)
            .join('\n');

        return replyWithContainer(interaction, {
            title: `**:bee: ┋ LISTA DE __${String(userData.name).toUpperCase()}__**\n\n`,
            avatar: interaction.user.displayAvatarURL(),
            color: 0xFF9955,
            message
        });
    }
};
