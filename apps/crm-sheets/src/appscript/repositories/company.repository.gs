const CompanyRepository = {
    getSheet,
    ensureSheet,
    findAll,
    findById,
    findBySubscriber,
    create,
    update,
    delete: remove,
    nextUid,
    getVisibleHeaders
};

function getCompanySheet(context) {
    return SheetRepository.getSheet(CRM.SHEETS.COMPANY, {
        createIfMissing: true,
        headers: Formatting.getCompanyHeadersForContext(context)
    });
}

function ensureSheet(context) {
    const sheet = getCompanySheet(context);
    SheetRepository.ensureHeaders(sheet, Formatting.getCompanyHeadersForContext(context));
    return sheet;
}

function getVisibleHeaders(context) {
    return Formatting.getCompanyHeadersForContext(context);
}

function findAll(context) {
    const sheet = ensureSheet(context);
    return SheetRepository.getObjects(sheet).map(CompanyDomain.fromRow);
}

function findById(uid, context) {
    const sheet = ensureSheet(context);
    const match = SheetRepository.findRow(sheet, row => String(row['UID']) === String(uid));
    return match ? CompanyDomain.fromRow(Helpers.rowFromObject(getVisibleHeaders(context), match.object)) : null;
}

function findBySubscriber(subscriber, context) {
    const sheet = ensureSheet(context);
    const owner = Helpers.normalizeString(subscriber);

    return SheetRepository.getObjects(sheet)
        .filter(row => Helpers.normalizeString(row.RESPONSÁVEL) === owner)
        .map(CompanyDomain.fromRow);
}

function nextUid(context) {
    const items = findAll(context);
    const max = items.reduce((acc, item) => {
        const numeric = Number.parseInt(item.uid, 10);
        return Number.isFinite(numeric) ? Math.max(acc, numeric) : acc;
    }, 0);

    return max + 1;
}

function create(company, context) {
    const sheet = ensureSheet(context);
    const payload = CompanyDomain.fromPayload(company);
    payload.uid = payload.uid || nextUid(context);
    payload.subscribers = payload.subscribers || (context && context.userName ? context.userName : '');

    const row = CompanyDomain.toRow(payload);
    SheetRepository.append(sheet, row);

    return payload;
}

function update(uid, company, context) {
    const sheet = ensureSheet(context);
    const existing = SheetRepository.findRow(sheet, row => String(row.UID) === String(uid));

    if (!existing) {
        throw new Error('Empresa não encontrada.');
    }

    const current = CompanyDomain.fromRow(Helpers.rowFromObject(getVisibleHeaders(context), existing.object));
    const patch = Helpers.stripUndefined(company || {});
    const merged = Object.assign({}, current);

    Object.keys(patch).forEach(key => {
        if (patch[key] !== undefined && patch[key] !== '') {
            merged[key] = patch[key];
        }
    });

    merged.uid = current.uid;
    const row = CompanyDomain.toRow(merged);

    SheetRepository.updateRow(sheet, existing.rowIndex, row);
    return merged;
}

function remove(uid, context) {
    const sheet = ensureSheet(context);
    const match = SheetRepository.findRow(sheet, row => String(row.UID) === String(uid));

    if (!match) {
        return false;
    }

    SheetRepository.deleteRow(sheet, match.rowIndex);
    return true;
}
