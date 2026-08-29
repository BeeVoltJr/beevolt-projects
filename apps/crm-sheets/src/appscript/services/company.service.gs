const CompanyService = {
    create,
    update,
    get,
    list,
    getFormContext,
    refresh
};

function create(data) {
    const context = Configuration.getContext();
    const payload = Validation.requireCompanyPayload(data);

    if (context.type === CRM.CONTEXT.MAIN) {
        payload.subscribers = Validation.ensureAllowedOwner(payload.subscribers, context);
        if (!payload.subscribers) {
            throw new Error('Selecione um responsável para a empresa.');
        }
    } else {
        payload.subscribers = context.userName;
    }

    const created = CompanyRepository.create(payload, context);
    FollowUpService.initializeForCompany(created, context);

    return {
        success: true,
        company: created
    };
}

function update(uid, data) {
    const context = Configuration.getContext();
    const company = CompanyRepository.findById(uid, context);

    if (!company) {
        throw new Error('Empresa não encontrada.');
    }

    if (context.type === CRM.CONTEXT.USER && Helpers.normalizeString(company.subscribers) !== Helpers.normalizeString(context.userName)) {
        throw new Error('Usuários USER não podem editar empresas de outros responsáveis.');
    }

    const raw = Helpers.stripUndefined(data || {});
    const payload = {};

    if (raw.name !== undefined) {
        payload.name = Validation.requireText(raw.name, 'O nome da empresa é obrigatório.');
    }

    if (raw.email !== undefined) {
        payload.email = Validation.requireEmail(raw.email, 'O email da empresa é obrigatório.');
    }

    if (raw.phone !== undefined) {
        payload.phone = Validation.requireText(raw.phone, 'O telefone da empresa é obrigatório.');
    }

    if (raw.website !== undefined) {
        payload.website = Helpers.normalizeString(raw.website);
    }

    if (raw.actfield !== undefined) {
        payload.actfield = Validation.requireText(raw.actfield, 'O campo de atuação da empresa é obrigatório.');
    }

    if (raw.insight !== undefined) {
        payload.insight = Validation.requireText(raw.insight, 'O insight da empresa é obrigatório.');
    }

    if (raw.service !== undefined) {
        payload.service = Validation.requireText(raw.service, 'O serviço da empresa é obrigatório.');
    }

    if (context.type === CRM.CONTEXT.USER) {
        payload.subscribers = context.userName;
    } else if (raw.subscribers !== undefined) {
        payload.subscribers = Validation.ensureAllowedOwner(raw.subscribers, context);
    }

    const updated = CompanyRepository.update(uid, payload, context);
    FollowUpService.syncCompany(updated);

    return {
        success: true,
        company: updated
    };
}

function get(uid) {
    const context = Configuration.getContext();
    return CompanyRepository.findById(uid, context);
}

function list() {
    const context = Configuration.getContext();
    return CompanyRepository.findAll(context);
}

function getFormContext(mode, uid) {
    const context = Configuration.getContext();
    const company = mode === CRM.MODES.EDIT && uid ? CompanyRepository.findById(uid, context) : null;
    const employees = context.type === CRM.CONTEXT.MAIN ? EmployeeRepository.findAll() : [];

    return {
        mode: mode || CRM.MODES.ADD,
        spreadsheetType: context.type,
        spreadsheetId: context.spreadsheetId,
        spreadsheetName: context.spreadsheetName,
        user: Configuration.getUser(),
        permissions: {
            canAssignEmployee: context.type === CRM.CONTEXT.MAIN,
            canEditOwner: context.type === CRM.CONTEXT.MAIN
        },
        employees: employees,
        company: company ? CompanyDomain.fromPayload(company) : null
    };
}

function refresh() {
    const context = Configuration.getContext();
    const sheet = CompanyRepository.ensureSheet(context);

    if (context.type === CRM.CONTEXT.USER) {
        const all = CompanyRepository.findAll(context);
        all.forEach(item => {
            if (Helpers.normalizeString(item.subscribers) !== Helpers.normalizeString(context.userName)) {
                item.subscribers = context.userName;
                CompanyRepository.update(item.uid, item, context);
            }
        });
    }

    SheetRepository.ensureHeaders(sheet, Formatting.getCompanyHeadersForContext(context));
    return CompanyRepository.findAll(context);
}
