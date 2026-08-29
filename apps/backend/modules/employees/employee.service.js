import { ValidationError } from '../shared/errors.js';
import { employeeRepository } from './employee.repository.js';

function assertValidUid(uid) {
    const parsedUid = Number.parseInt(uid, 10);

    if (!Number.isInteger(parsedUid) || parsedUid <= 0) {
        throw new ValidationError('Identificador (UID) do colaborador inválido ou ausente.');
    }

    return parsedUid;
}

function assertValidName(name) {
    if (typeof name !== 'string' || name.trim().length === 0) {
        throw new ValidationError('O nome do colaborador é obrigatório.');
    }

    return name.trim();
}

export const employeeService = {
    async getEmployees() {
        return employeeRepository.findAll();
    },

    async getEmployeeByName(name) {
        return employeeRepository.findByName(assertValidName(name));
    },

    async getEmployeeByUid(uid) {
        return employeeRepository.findByUid(assertValidUid(uid));
    },

    async getEmployeeByDiscordUid(discordUid) {
        if (typeof discordUid === 'undefined' || discordUid === null || String(discordUid).trim().length === 0) {
            throw new ValidationError('Identificador do Discord inválido ou ausente.');
        }

        return employeeRepository.findByDiscordUid(String(discordUid));
    }
};

export { assertValidName, assertValidUid };
