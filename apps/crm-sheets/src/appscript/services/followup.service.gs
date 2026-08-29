const FollowUpService = {
    getNextState,
    initializeForCompany,
    processDueFollowUps,
    syncCompany,
    registerResponse
};

function getNextState(currentState) {
    const next = FollowUpDomain.getNextState(currentState);

    if (next.stage === CRM.FOLLOWUP.STAGES.FAREWELL) {
        return next;
    }

    next.nextActionAt = Helpers.addDaysIso(next.lastActionAt || Helpers.nowIso(), CRM.FOLLOWUP.DEFAULT_DELAY_DAYS);
    next.status = CRM.FOLLOWUP.STATUSES.WAITING;
    return next;
}

function initializeForCompany(company, context) {
    const payload = CompanyDomain.fromPayload(company);
    const owner = Helpers.normalizeString(payload.subscribers) || (context && context.userName ? context.userName : Configuration.getUser().name);
    const initial = FollowUpDomain.createState({
        companyUid: payload.uid,
        companyName: payload.name,
        owner,
        stage: CRM.FOLLOWUP.STAGES.FU1,
        temperature: CRM.FOLLOWUP.TEMPERATURES.COLD,
        status: CRM.FOLLOWUP.STATUSES.WAITING,
        attempt: 0,
        lastActionAt: Helpers.nowIso(),
        nextActionAt: Helpers.addDaysIso(Helpers.nowIso(), CRM.FOLLOWUP.DEFAULT_DELAY_DAYS),
        notes: ''
    });

    FollowUpRepository.create(initial);
    return initial;
}

function processDueFollowUps(referenceDate) {
    const now = referenceDate || new Date();
    const dueItems = FollowUpRepository.findDue(now);
    const processed = [];

    dueItems.forEach(item => {
        const current = item.data;
        const nextState = getNextState(current);
        const completed = nextState.stage === CRM.FOLLOWUP.STAGES.FAREWELL || nextState.status === CRM.FOLLOWUP.STATUSES.RESPONDED;

        if (completed) {
            FollowUpRepository.complete(current.companyUid);
            processed.push(Object.assign({}, nextState, { completed: true }));
            return;
        }

        FollowUpRepository.moveToStage(current.companyUid, nextState);
        processed.push(Object.assign({}, nextState, { completed: false }));
    });

    return {
        success: true,
        count: processed.length,
        items: processed
    };
}

function syncCompany(company) {
    const normalized = CompanyDomain.fromPayload(company);
    const matches = FollowUpRepository.findByCompany(normalized.uid);

    if (!matches.length) {
        return false;
    }

    matches.forEach(match => {
        const next = Object.assign({}, match.data, {
            companyName: normalized.name,
            owner: normalized.subscribers || match.data.owner
        });

        FollowUpRepository.update(next);
    });

    return true;
}

function registerResponse(companyUid, respondedAt) {
    const matches = FollowUpRepository.findByCompany(companyUid);

    if (!matches.length) {
        return false;
    }

    const match = matches[0];
    FollowUpRepository.update(Object.assign({}, match.data, {
        status: CRM.FOLLOWUP.STATUSES.RESPONDED,
        temperature: CRM.FOLLOWUP.TEMPERATURES.RESPONDED,
        respondedAt: Helpers.toIsoString(respondedAt || new Date()),
        nextActionAt: '',
        stage: CRM.FOLLOWUP.STAGES.FAREWELL
    }));

    return true;
}
