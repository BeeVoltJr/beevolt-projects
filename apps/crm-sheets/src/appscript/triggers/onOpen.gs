function onOpen(e) {
    const context = Configuration.getContext();
    const ui = SpreadsheetApp.getUi();
    const menu = ui.createMenu('BeeVolt');

    if (context.type === CRM.CONTEXT.MAIN) {
        menu.addItem('Atualizar Dados', 'RefreshCompanies');
        menu.addItem('Nova Empresa', 'OpenAddCompanyDialog');
        menu.addItem('Editar Empresa', 'OpenEditCompanyDialog');
        menu.addItem('Processar Follow-ups', 'ProcessFollowUps');
    } else {
        menu.addItem('Atualizar Dados', 'RefreshCompanies');
        menu.addItem('Nova Empresa', 'OpenAddCompanyDialog');
        menu.addItem('Editar Empresa', 'OpenEditCompanyDialog');
    }

    menu.addToUi();
    RefreshCompanies();
}
