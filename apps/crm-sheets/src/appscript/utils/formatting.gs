const Formatting = {
    getCompanyHeaders,
    getCompanyHeadersForContext,
    getEmployeeHeaders,
    getFollowupHeaders,
    formatSheetName,
    formatCompanyLabel,
    formatUid,
    formatDate,
    formatDialogTitle,
    buildCompanySummary,
    applyBasicTableFormat
};

function getCompanyHeaders() {
    return CRM.COMPANY_HEADERS.slice();
}

function getCompanyHeadersForContext(context) {
    if (context && context.type === CRM.CONTEXT.USER) {
        return CRM.USER_COMPANY_HEADERS.slice();
    }

    return CRM.COMPANY_HEADERS.slice();
}

function getEmployeeHeaders() {
    return CRM.EMPLOYEE_HEADERS.slice();
}

function getFollowupHeaders() {
    return CRM.FOLLOWUP_HEADERS.slice();
}

function formatSheetName(name) {
    return Helpers.normalizeString(name);
}

function formatCompanyLabel(company) {
    if (!company) {
        return 'Empresa';
    }

    const uid = formatUid(company.uid);
    const name = Helpers.normalizeString(company.name) || 'Empresa';

    return `${name} [ LID: ${uid} ]`;
}

function formatUid(uid) {
    const numeric = Number.parseInt(uid, 10);
    return Number.isFinite(numeric) ? String(numeric) : '';
}

function formatDate(value) {
    if (!value) {
        return '';
    }

    const date = value instanceof Date ? value : new Date(value);
    return isNaN(date.getTime()) ? '' : Utilities.formatDate(date, Session.getScriptTimeZone() || 'GMT', 'yyyy-MM-dd HH:mm:ss');
}

function formatDialogTitle(mode, context) {
    const user = context && context.userName ? ` | ${context.userName}` : '';

    if (mode === CRM.MODES.EDIT) {
        return `Editar Empresa${user}`;
    }

    return `Adicionar Empresa${user}`;
}

function buildCompanySummary(company) {
    if (!company) {
        return {};
    }

    return {
        uid: formatUid(company.uid),
        name: Helpers.normalizeString(company.name),
        email: Helpers.normalizeString(company.email),
        phone: Helpers.normalizeString(company.phone),
        website: Helpers.normalizeString(company.website),
        actfield: Helpers.normalizeString(company.actfield),
        insight: Helpers.normalizeString(company.insight),
        service: Helpers.normalizeString(company.service),
        subscribers: Helpers.normalizeString(company.subscribers)
    };
}

function applyBasicTableFormat(sheet, headerSize) {
    if (!sheet) {
        return;
    }

    const lastColumn = Math.max(headerSize || 1, sheet.getLastColumn());

    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, lastColumn)
        .setFontWeight('bold')
        .setHorizontalAlignment('center')
        .setWrap(true);
}
