const CRM = Object.freeze({
    SHEETS: Object.freeze({
        COMPANY: 'Empresas Cadastradas',
        EMPLOYEE: 'Colaboradores',
        FOLLOWUPS: ['FU1', 'FU2', 'FU3']
    }),
    CONTEXT: Object.freeze({
        MAIN: 'MAIN',
        USER: 'USER'
    }),
    MODES: Object.freeze({
        ADD: 'add',
        EDIT: 'edit'
    }),
    PROPS: Object.freeze({
        CONTEXT_PREFIX: 'BEEVOLT_CRM_CONTEXT_',
        EMPLOYEES: 'BEEVOLT_CRM_EMPLOYEES'
    }),
    FOLLOWUP: Object.freeze({
        STAGES: Object.freeze({
            FU1: 'FU1',
            FU2: 'FU2',
            FU3: 'FU3',
            FAREWELL: 'FAREWELL'
        }),
        TEMPERATURES: Object.freeze({
            COLD: 'COLD',
            WARM: 'WARM',
            HOT: 'HOT',
            RESPONDED: 'RESPONDED'
        }),
        STATUSES: Object.freeze({
            WAITING: 'WAITING',
            DUE: 'DUE',
            RESPONDED: 'RESPONDED',
            COMPLETE: 'COMPLETE'
        }),
        DEFAULT_DELAY_DAYS: 3
    }),
    COMPANY_HEADERS: Object.freeze([
        'UID',
        'EMPRESA',
        'EMAIL',
        'TELEFONE',
        'SITE',
        'RAMO DE ATIVIDADE',
        'INSIGHT',
        'SERVIÇO',
        'RESPONSÁVEL'
    ]),
    USER_COMPANY_HEADERS: Object.freeze([
        'UID',
        'EMPRESA',
        'EMAIL',
        'TELEFONE',
        'SITE',
        'RAMO DE ATIVIDADE',
        'INSIGHT',
        'SERVIÇO',
        'RESPONSÁVEL'
    ]),
    EMPLOYEE_HEADERS: Object.freeze([
        'UID',
        'NOME',
        'EMAIL',
        'ATIVO'
    ]),
    FOLLOWUP_HEADERS: Object.freeze([
        'COMPANY_UID',
        'EMPRESA',
        'RESPONSÁVEL',
        'ETAPA',
        'TEMPERATURA',
        'STATUS',
        'TENTATIVA',
        'LAST_ACTION_AT',
        'NEXT_ACTION_AT',
        'RESPONDED_AT',
        'NOTES'
    ])
});

function CRM_getCompanyFieldMap() {
    return {
        uid: 0,
        name: 1,
        email: 2,
        phone: 3,
        website: 4,
        actfield: 5,
        insight: 6,
        service: 7,
        subscribers: 8
    };
}
