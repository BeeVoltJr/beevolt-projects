const Configuration = {
    getContext,
    setContext,
    clearContext,
    isMain,
    isUser,
    getUser,
    getSpreadsheet,
    getSpreadsheetId,
    getSpreadsheetName
};

function getSpreadsheet() {
    return SpreadsheetApp.getActiveSpreadsheet();
}

function getSpreadsheetId() {
    const spreadsheet = getSpreadsheet();
    return spreadsheet ? spreadsheet.getId() : '';
}

function getSpreadsheetName() {
    const spreadsheet = getSpreadsheet();
    return spreadsheet ? spreadsheet.getName() : '';
}

function contextPropertyKey(spreadsheetId) {
    return CRM.PROPS.CONTEXT_PREFIX + spreadsheetId;
}

function getStoredContext() {
    const spreadsheetId = getSpreadsheetId();
    if (!spreadsheetId) {
        return null;
    }

    const raw = PropertiesService.getScriptProperties().getProperty(contextPropertyKey(spreadsheetId));
    if (!raw) {
        return null;
    }

    try {
        return JSON.parse(raw);
    } catch (error) {
        return null;
    }
}

function inferContext() {
    const spreadsheet = getSpreadsheet();
    const spreadsheetId = spreadsheet ? spreadsheet.getId() : '';
    const spreadsheetName = spreadsheet ? spreadsheet.getName() : '';

    const stored = getStoredContext();
    if (stored) {
        return Object.assign(
            {
                spreadsheetId,
                spreadsheetName
            },
            stored
        );
    }

    const match = String(spreadsheetName).match(/^crm-sheet-(.+)$/i);
    if (match && match[1]) {
        const userName = String(match[1]).replace(/_/g, ' ').trim();

        return {
            type: CRM.CONTEXT.USER,
            userId: userName.toLowerCase().replace(/\s+/g, '-'),
            userName,
            spreadsheetId,
            spreadsheetName
        };
    }

    return {
        type: CRM.CONTEXT.MAIN,
        spreadsheetId,
        spreadsheetName
    };
}

function getContext() {
    const context = inferContext();
    context.type = context.type === CRM.CONTEXT.USER ? CRM.CONTEXT.USER : CRM.CONTEXT.MAIN;

    if (context.type === CRM.CONTEXT.USER) {
        context.userId = context.userId || context.userName || '';
        context.userName = context.userName || context.userId || '';
    }

    return context;
}

function setContext(context) {
    const spreadsheetId = getSpreadsheetId();
    if (!spreadsheetId) {
        throw new Error('Não foi possível identificar a planilha ativa.');
    }

    const normalized = {
        type: context.type === CRM.CONTEXT.USER ? CRM.CONTEXT.USER : CRM.CONTEXT.MAIN,
        userId: context.userId || '',
        userName: context.userName || '',
        spreadsheetId,
        spreadsheetName: getSpreadsheetName()
    };

    PropertiesService.getScriptProperties().setProperty(
        contextPropertyKey(spreadsheetId),
        JSON.stringify(normalized)
    );

    return normalized;
}

function clearContext() {
    const spreadsheetId = getSpreadsheetId();
    if (!spreadsheetId) {
        return;
    }

    PropertiesService.getScriptProperties().deleteProperty(contextPropertyKey(spreadsheetId));
}

function isMain() {
    return getContext().type === CRM.CONTEXT.MAIN;
}

function isUser() {
    return getContext().type === CRM.CONTEXT.USER;
}

function getUser() {
    const context = getContext();

    return {
        id: context.userId || '',
        name: context.userName || ''
    };
}
