const CompanyController = {
    add,
    edit,
    get,
    getFormContext,
    list,
    refresh,
    openAddDialog,
    openEditDialog
};

function add(data) {
    const result = CompanyService.create(data);

    return {
        success: true,
        message: 'Empresa cadastrada com sucesso!',
        company: result.company
    };
}

function edit(uid, data) {
    const result = CompanyService.update(uid, data);

    return {
        success: true,
        message: 'Dados atualizados com sucesso!',
        company: result.company
    };
}

function get(uid) {
    return CompanyService.get(uid);
}

function list() {
    return CompanyService.list();
}

function getFormContext(mode, uid) {
    return CompanyService.getFormContext(mode, uid);
}

function refresh() {
    return CompanyService.refresh();
}

function openAddDialog() {
    return UiDialogs.showCompanyDialog(CRM.MODES.ADD);
}

function openEditDialog() {
    const context = Configuration.getContext();
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const ui = SpreadsheetApp.getUi();

    if (sheet.getName() !== CRM.SHEETS.COMPANY) {
        ui.alert(`Você só pode editar empresas na planilha ${CRM.SHEETS.COMPANY}.`);
        return null;
    }

    const activeCell = sheet.getActiveCell();
    if (!activeCell || activeCell.getRow() < 2) {
        ui.alert('Por favor, selecione uma linha válida para editar.');
        return null;
    }

    const uid = String(sheet.getRange(activeCell.getRow(), 1).getValue() || '').trim();
    if (!uid) {
        ui.alert('Não foi possível identificar o UID da empresa selecionada.');
        return null;
    }

    const company = CompanyRepository.findById(uid, context);
    if (!company) {
        ui.alert('Empresa não encontrada.');
        return null;
    }

    return UiDialogs.showCompanyDialog(CRM.MODES.EDIT, uid);
}
