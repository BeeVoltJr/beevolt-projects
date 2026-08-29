function onEdit(e) {
    if (!e || !e.range) {
        return;
    }

    const sheetName = e.range.getSheet().getName();
    if (sheetName !== CRM.SHEETS.COMPANY) {
        return;
    }

    RefreshCompanies();
}
