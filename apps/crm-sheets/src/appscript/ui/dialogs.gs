const UiDialogs = {
    showCompanyDialog,
    include,
    showMessage,
    getDialogTitle
};

function include(filename) {
    return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function getDialogTitle(mode, context) {
    return Formatting.formatDialogTitle(mode, context);
}

function showCompanyDialog(mode, uid) {
    const template = HtmlService.createTemplateFromFile('forms');
    const context = Configuration.getContext();

    template.mode = mode || CRM.MODES.ADD;
    template.companyUid = uid || '';
    template.dialogTitle = getDialogTitle(template.mode, context);

    const html = template.evaluate()
        .setWidth(1024)
        .setHeight(720);

    SpreadsheetApp.getUi().showModalDialog(html, template.dialogTitle);
}

function showMessage(title, message) {
    SpreadsheetApp.getUi().alert(title, message, SpreadsheetApp.getUi().ButtonSet.OK);
}
