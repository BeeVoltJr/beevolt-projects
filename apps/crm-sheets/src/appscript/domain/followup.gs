const FollowUpDomain = {
    stages: CRM.FOLLOWUP.STAGES,
    temperatures: CRM.FOLLOWUP.TEMPERATURES,
    statuses: CRM.FOLLOWUP.STATUSES,
    createState,
    getNextState,
    isDue,
    isFinished,
    nextStage
};

function createState(data = {}) {
    const stage = normalizeStage(data.stage);
    const temperature = normalizeTemperature(data.temperature);
    const status = normalizeStatus(data.status);

    return {
        companyUid: Helpers.normalizeString(data.companyUid),
        companyName: Helpers.normalizeString(data.companyName),
        owner: Helpers.normalizeString(data.owner),
        stage,
        temperature,
        status,
        attempt: Number.parseInt(data.attempt, 10) || 0,
        lastActionAt: Helpers.normalizeString(data.lastActionAt),
        nextActionAt: Helpers.normalizeString(data.nextActionAt),
        respondedAt: Helpers.normalizeString(data.respondedAt),
        notes: Helpers.normalizeString(data.notes)
    };
}

function getNextState(currentState) {
    const state = createState(currentState);

    if (state.temperature === CRM.FOLLOWUP.TEMPERATURES.RESPONDED || state.status === CRM.FOLLOWUP.STATUSES.RESPONDED) {
        return Object.assign({}, state, {
            stage: CRM.FOLLOWUP.STAGES.FAREWELL,
            status: CRM.FOLLOWUP.STATUSES.RESPONDED,
            respondedAt: state.respondedAt || Helpers.nowIso(),
            nextActionAt: ''
        });
    }

    if (state.stage === CRM.FOLLOWUP.STAGES.FU3) {
        return Object.assign({}, state, {
            stage: CRM.FOLLOWUP.STAGES.FAREWELL,
            status: CRM.FOLLOWUP.STATUSES.COMPLETE,
            nextActionAt: '',
            lastActionAt: Helpers.nowIso()
        });
    }

    return Object.assign({}, state, {
        stage: nextStage(state.stage),
        status: CRM.FOLLOWUP.STATUSES.WAITING,
        attempt: state.attempt + 1,
        lastActionAt: Helpers.nowIso()
    });
}

function nextStage(stage) {
    if (stage === CRM.FOLLOWUP.STAGES.FU1) {
        return CRM.FOLLOWUP.STAGES.FU2;
    }

    if (stage === CRM.FOLLOWUP.STAGES.FU2) {
        return CRM.FOLLOWUP.STAGES.FU3;
    }

    return CRM.FOLLOWUP.STAGES.FAREWELL;
}

function normalizeStage(stage) {
    const value = Helpers.normalizeString(stage).toUpperCase();
    if (CRM.FOLLOWUP.STAGES.FU1 === value || CRM.FOLLOWUP.STAGES.FU2 === value || CRM.FOLLOWUP.STAGES.FU3 === value || CRM.FOLLOWUP.STAGES.FAREWELL === value) {
        return value;
    }

    return CRM.FOLLOWUP.STAGES.FU1;
}

function normalizeTemperature(temperature) {
    const value = Helpers.normalizeString(temperature).toUpperCase();
    if (CRM.FOLLOWUP.TEMPERATURES.COLD === value || CRM.FOLLOWUP.TEMPERATURES.WARM === value || CRM.FOLLOWUP.TEMPERATURES.HOT === value || CRM.FOLLOWUP.TEMPERATURES.RESPONDED === value) {
        return value;
    }

    return CRM.FOLLOWUP.TEMPERATURES.COLD;
}

function normalizeStatus(status) {
    const value = Helpers.normalizeString(status).toUpperCase();
    if (CRM.FOLLOWUP.STATUSES.WAITING === value || CRM.FOLLOWUP.STATUSES.DUE === value || CRM.FOLLOWUP.STATUSES.RESPONDED === value || CRM.FOLLOWUP.STATUSES.COMPLETE === value) {
        return value;
    }

    return CRM.FOLLOWUP.STATUSES.WAITING;
}

function isDue(state, now) {
    const followup = createState(state);
    if (!followup.nextActionAt) {
        return false;
    }

    const next = new Date(followup.nextActionAt).getTime();
    const reference = now instanceof Date ? now.getTime() : new Date(now || new Date()).getTime();

    return Number.isFinite(next) && next <= reference && !isFinished(followup);
}

function isFinished(state) {
    const followup = createState(state);
    return followup.status === CRM.FOLLOWUP.STATUSES.RESPONDED || followup.status === CRM.FOLLOWUP.STATUSES.COMPLETE || followup.stage === CRM.FOLLOWUP.STAGES.FAREWELL;
}
