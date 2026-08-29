const FollowUpRepository = {
    getSheet,
    ensureSheet,
    listStages,
    findPending,
    findDue,
    findByCompany,
    create,
    update,
    complete,
    moveToStage
};

function listStages() {
    return CRM.SHEETS.FOLLOWUPS.slice();
}

function getSheet(stage) {
    return SheetRepository.getSheet(stage, {
        createIfMissing: true,
        headers: CRM.FOLLOWUP_HEADERS
    });
}

function ensureSheet(stage) {
    const sheet = getSheet(stage);
    SheetRepository.ensureHeaders(sheet, CRM.FOLLOWUP_HEADERS);
    return sheet;
}

function collectAllFollowups() {
    const items = [];

    listStages().forEach(stage => {
        const sheet = ensureSheet(stage);
        SheetRepository.getObjects(sheet).forEach(row => {
            items.push({
                stage,
                rowIndex: null,
                data: FollowUpDomain.createState(Object.assign({}, row, { stage }))
            });
        });
    });

    return items;
}

function findPending() {
    return collectAllFollowups()
        .filter(item => !FollowUpDomain.isFinished(item.data));
}

function findDue(date) {
    return collectAllFollowups()
        .filter(item => FollowUpDomain.isDue(item.data, date));
}

function findByCompany(companyUid) {
    const target = Helpers.normalizeString(companyUid);
    const found = [];

    listStages().forEach(stage => {
        const sheet = ensureSheet(stage);
        const match = SheetRepository.findRow(sheet, row => Helpers.normalizeString(row.COMPANY_UID) === target);

        if (match) {
            found.push({
                stage,
                rowIndex: match.rowIndex,
                data: FollowUpDomain.createState(Object.assign({}, match.object, { stage }))
            });
        }
    });

    return found;
}

function create(data) {
    const state = FollowUpDomain.createState(data);
    const stage = state.stage || CRM.FOLLOWUP.STAGES.FU1;
    const sheet = ensureSheet(stage);
    SheetRepository.append(sheet, followupToRow(state));
    return state;
}

function update(data) {
    const state = FollowUpDomain.createState(data);
    const matches = findByCompany(state.companyUid);
    const target = matches[0];

    if (!target) {
        throw new Error('Follow-up não encontrado.');
    }

    const sheet = ensureSheet(target.stage);
    const next = FollowUpDomain.createState(Object.assign({}, target.data, state));
    SheetRepository.updateRow(sheet, target.rowIndex, followupToRow(next));
    return next;
}

function complete(companyUid) {
    const matches = findByCompany(companyUid);

    if (!matches.length) {
        return false;
    }

    const current = matches[0];
    const sheet = ensureSheet(current.stage);
    const completed = Object.assign({}, current.data, {
        status: CRM.FOLLOWUP.STATUSES.COMPLETE,
        nextActionAt: '',
        respondedAt: current.data.respondedAt || Helpers.nowIso(),
        stage: CRM.FOLLOWUP.STAGES.FAREWELL
    });

    SheetRepository.updateRow(sheet, current.rowIndex, followupToRow(completed));
    return true;
}

function moveToStage(companyUid, nextState) {
    const matches = findByCompany(companyUid);

    if (!matches.length) {
        throw new Error('Follow-up não encontrado.');
    }

    const current = matches[0];
    const currentSheet = ensureSheet(current.stage);
    const updated = FollowUpDomain.createState(Object.assign({}, current.data, nextState));
    const targetSheet = ensureSheet(updated.stage);

    if (targetSheet.getName() !== currentSheet.getName()) {
        SheetRepository.deleteRow(currentSheet, current.rowIndex);
        SheetRepository.append(targetSheet, followupToRow(updated));
        return updated;
    }

    SheetRepository.updateRow(currentSheet, current.rowIndex, followupToRow(updated));
    return updated;
}

function followupToRow(state) {
    return [
        state.companyUid,
        state.companyName,
        state.owner,
        state.stage,
        state.temperature,
        state.status,
        state.attempt,
        state.lastActionAt,
        state.nextActionAt,
        state.respondedAt,
        state.notes
    ];
}
