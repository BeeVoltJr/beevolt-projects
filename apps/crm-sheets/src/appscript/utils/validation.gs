const Validation = {
    requireText,
    requireEmail,
    requirePositiveInteger,
    requireCompanyPayload,
    sanitizeCompanyPayload,
    sanitizeEmployeePayload,
    normalizeOwner,
    ensureAllowedOwner
};

function requireText(value, message) {
    const text = Helpers.normalizeString(value);

    if (!text) {
        throw new Error(message);
    }

    return text;
}

function requireEmail(value, message) {
    const email = Helpers.normalizeString(value);
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!regex.test(email)) {
        throw new Error(message);
    }

    return email;
}

function requirePositiveInteger(value, message) {
    const number = Number.parseInt(value, 10);

    if (!Number.isInteger(number) || number <= 0) {
        throw new Error(message);
    }

    return number;
}

function requireCompanyPayload(data) {
    return sanitizeCompanyPayload(data, { requireAll: true });
}

function sanitizeCompanyPayload(data, options = {}) {
    const requireAll = Boolean(options.requireAll);
    const payload = Helpers.stripUndefined(data);
    const normalized = {
        name: Helpers.normalizeString(payload.name),
        email: Helpers.normalizeString(payload.email),
        phone: Helpers.normalizeString(payload.phone),
        website: Helpers.normalizeString(payload.website),
        actfield: Helpers.normalizeString(payload.actfield),
        insight: Helpers.normalizeString(payload.insight),
        service: Helpers.normalizeString(payload.service),
        subscribers: Helpers.normalizeString(payload.subscribers)
    };

    if (requireAll) {
        normalized.name = requireText(normalized.name, 'O nome da empresa é obrigatório.');
        normalized.email = requireEmail(normalized.email, 'O email da empresa é obrigatório.');
        normalized.phone = requireText(normalized.phone, 'O telefone da empresa é obrigatório.');
        normalized.actfield = requireText(normalized.actfield, 'O campo de atuação da empresa é obrigatório.');
        normalized.insight = requireText(normalized.insight, 'O insight da empresa é obrigatório.');
        normalized.service = requireText(normalized.service, 'O serviço da empresa é obrigatório.');
    } else {
        if (normalized.name) {
            normalized.name = requireText(normalized.name, 'O nome da empresa é obrigatório.');
        }

        if (normalized.email) {
            normalized.email = requireEmail(normalized.email, 'O email da empresa é obrigatório.');
        }
    }

    if (normalized.website && normalized.website !== 'N/A') {
        normalized.website = normalized.website;
    }

    return normalized;
}

function sanitizeEmployeePayload(data) {
    const payload = Helpers.stripUndefined(data);

    return {
        uid: payload.uid ? requirePositiveInteger(payload.uid, 'UID do colaborador inválido.') : '',
        name: payload.name ? requireText(payload.name, 'Nome do colaborador inválido.') : '',
        email: payload.email ? requireEmail(payload.email, 'Email do colaborador inválido.') : '',
        active: payload.active === undefined ? true : Boolean(payload.active)
    };
}

function normalizeOwner(value, context) {
    const owner = Helpers.normalizeString(value);

    if (Configuration.isUser() && context && context.userName) {
        return context.userName;
    }

    return owner;
}

function ensureAllowedOwner(owner, context) {
    if (Configuration.isUser()) {
        const userName = Helpers.normalizeString(context && context.userName ? context.userName : Configuration.getUser().name);
        if (owner && owner !== userName) {
            throw new Error('Usuários USER não podem alterar o responsável da empresa.');
        }

        return userName;
    }

    return Helpers.normalizeString(owner);
}
