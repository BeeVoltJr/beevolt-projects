function AddCompany(data) {
    return CompanyController.add(data);
}

function EditCompany(uid, data) {
    return CompanyController.edit(uid, data);
}

function GetCompany(uid) {
    return CompanyController.get(uid);
}

function GetCompanies() {
    return CompanyController.list();
}

function GetFormContext(mode, uid) {
    return CompanyController.getFormContext(mode, uid);
}

function ProcessFollowUps() {
    return FollowUpController.processDue();
}

function RegisterFollowUpResponse(companyUid, respondedAt) {
    return FollowUpController.registerResponse(companyUid, respondedAt);
}

function OpenAddCompanyDialog() {
    return CompanyController.openAddDialog();
}

function OpenEditCompanyDialog() {
    return CompanyController.openEditDialog();
}

function RefreshCompanies() {
    return CompanyController.refresh();
}

function RegisterEmployee(data) {
    return EmployeeController.create(data);
}

function UpdateEmployee(uid, data) {
    return EmployeeController.update(uid, data);
}

function RemoveEmployee(uid) {
    return EmployeeController.remove(uid);
}

function GetEmployees() {
    return EmployeeController.list();
}

function ConfigureCrm(context) {
    return Configuration.setContext(context);
}

function ResetCrmConfiguration() {
    return Configuration.clearContext();
}

function include(filename) {
    return UiDialogs.include(filename);
}
