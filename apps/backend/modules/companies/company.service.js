import {
    LOG_TYPE,
    SendConsoleDebug,
    SendConsoleErr,
    SendConsoleWarn,
    SendDiscordLog
} from '@beevolt/logging';

import { ValidationError } from '../shared/errors.js';
import { companyRepository } from './company.repository.js';

const COMPANY_FIELDS = [
    'name',
    'email',
    'phone',
    'website',
    'actfield',
    'insight',
    'service',
    'subscribers'
];

function pickCompanyFields(data = {}) {
    return Object.fromEntries(
        Object.entries(data).filter(([key, value]) => COMPANY_FIELDS.includes(key) && value !== undefined)
    );
}

function assertValidUid(uid) {
    const parsedUid = Number.parseInt(uid, 10);

    if (!Number.isInteger(parsedUid) || parsedUid <= 0) {
        throw new ValidationError('Identificador (UID) da empresa inválido ou ausente.');
    }

    return parsedUid;
}

function assertHasCompanyName(data) {
    if (!data || typeof data.name !== 'string' || data.name.trim().length === 0) {
        throw new ValidationError('O nome da empresa é obrigatório.');
    }
}

export const companyService = {
    async getCompanies({ start, end, subscriber } = {}) {
        if (typeof subscriber === 'string' && subscriber.trim().length > 0) {
            return companyRepository.findBySubscriber(subscriber.trim());
        }

        const parsedStart = Number.parseInt(start, 10);
        const parsedEnd = Number.parseInt(end, 10);

        if (Number.isInteger(parsedStart) && Number.isInteger(parsedEnd)) {
            return companyRepository.findByUidRange(parsedStart, parsedEnd);
        }

        return companyRepository.findAll();
    },

    async getCompanyByUid(uid) {
        const parsedUid = assertValidUid(uid);
        return companyRepository.findByUid(parsedUid);
    },

    async createCompany(data) {
        assertHasCompanyName(data);

        const payload = pickCompanyFields(data);
        const result = await companyRepository.create(payload);

        if (!result.success) {
            SendConsoleErr('NECKTAR TRACK', `Erro ao adicionar empresa: ${result.reason}`);
            return result;
        }

        const addedCompany = await companyRepository.findByUid(result.lastID);
        const companyName = addedCompany?.name || data.name;
        const subscriber = addedCompany?.subscribers || data.subscribers || 'Sistema';

        SendConsoleWarn(
            'NECKTAR TRACK',
            `A empresa ${companyName} [ LID: ${result.lastID} ] foi adicionada por ${subscriber}`
        );

        void SendDiscordLog(
            LOG_TYPE.warn,
            `A empresa \`\`\`${companyName} [ LID: ${result.lastID} ]\`\`\` foi adicionada por \`\`\`${subscriber}\`\`\``
        );

        SendConsoleDebug('NECKTAR TRACK', `Empresa criada com sucesso com LID ${result.lastID}`);

        return result;
    },

    async updateCompany(uid, data) {
        const parsedUid = assertValidUid(uid);
        const payload = pickCompanyFields(data);

        if (Object.keys(payload).length === 0) {
            throw new ValidationError('Você precisa alterar algum campo antes de enviar novos dados!');
        }

        const result = await companyRepository.update(parsedUid, payload);

        if (!result.success) {
            SendConsoleErr('NECKTAR TRACK', `Erro ao atualizar empresa UID ${parsedUid}: ${result.reason}`);
            return result;
        }

        const updatedCompany = await companyRepository.findByUid(parsedUid);
        const companyName = updatedCompany?.name || 'Empresa';
        const subscriber = updatedCompany?.subscribers || 'Sistema';

        SendConsoleWarn(
            'NECKTAR TRACK',
            `A empresa ${companyName} [ LID: ${parsedUid} ] foi atualizada por ${subscriber}`
        );

        void SendDiscordLog(
            LOG_TYPE.warn,
            `A empresa \`\`\`${companyName} [ LID: ${parsedUid} ]\`\`\` foi atualizada por \`\`\`${subscriber}\`\`\``
        );

        return result;
    }
};

export { COMPANY_FIELDS, assertHasCompanyName, assertValidUid, pickCompanyFields };
