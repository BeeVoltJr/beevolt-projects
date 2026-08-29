const FollowUpController = {
    processDue,
    create,
    update,
    complete,
    registerResponse,
    getNextState
};

function processDue() {
    return FollowUpService.processDueFollowUps(new Date());
}

function create(data) {
    return FollowUpService.initializeForCompany(data, Configuration.getContext());
}

function update(data) {
    return FollowUpRepository.update(data);
}

function complete(companyUid) {
    return FollowUpRepository.complete(companyUid);
}

function registerResponse(companyUid, respondedAt) {
    return FollowUpService.registerResponse(companyUid, respondedAt);
}

function getNextState(currentState) {
    return FollowUpService.getNextState(currentState);
}
