const SheetRepository = {
    getSpreadsheet,
    getSheet,
    ensureHeaders,
    getHeaders,
    getDataRows,
    getObjects,
    findRow,
    append,
    updateRow,
    deleteRow,
    insertRows,
    clearData,
    setSheetTitle,
    getNamedSheet
};

function getNamedSheet(name) {
    const spreadsheet = Configuration.getSpreadsheet();
    return spreadsheet ? spreadsheet.getSheetByName(name) : null;
}

function getSpreadsheet() {
    return Configuration.getSpreadsheet();
}

function getSheet(name, options = {}) {
    const spreadsheet = getSpreadsheet();
    if (!spreadsheet) {
        throw new Error('Nenhuma planilha ativa encontrada.');
    }

    let sheet = spreadsheet.getSheetByName(name);
    if (!sheet && options.createIfMissing) {
        sheet = spreadsheet.insertSheet(name);
    }

    if (sheet && options.headers && options.headers.length) {
        ensureHeaders(sheet, options.headers);
    }

    return sheet;
}

function ensureHeaders(sheet, headers) {
    if (!sheet || !headers || !headers.length) {
        return;
    }

    const currentHeaders = getHeaders(sheet);
    const normalizedCurrent = JSON.stringify(currentHeaders);
    const normalizedExpected = JSON.stringify(headers);

    if (normalizedCurrent !== normalizedExpected) {
        sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    }

    Formatting.applyBasicTableFormat(sheet, headers.length);
}

function getHeaders(sheet) {
    if (!sheet) {
        return [];
    }

    const lastColumn = sheet.getLastColumn();
    if (lastColumn < 1) {
        return [];
    }

    return sheet.getRange(1, 1, 1, lastColumn).getValues()[0].map(header => Helpers.normalizeString(header));
}

function getDataRows(sheet) {
    if (!sheet) {
        return [];
    }

    const lastRow = sheet.getLastRow();
    const lastColumn = sheet.getLastColumn();

    if (lastRow < 2 || lastColumn < 1) {
        return [];
    }

    return sheet.getRange(2, 1, lastRow - 1, lastColumn).getValues();
}

function getObjects(sheet) {
    const headers = getHeaders(sheet);

    return getDataRows(sheet)
        .filter(row => row.some(cell => Helpers.normalizeString(cell) !== ''))
        .map(row => Helpers.objectFromRow(headers, row));
}

function findRow(sheet, predicate) {
    const headers = getHeaders(sheet);
    const rows = getDataRows(sheet);

    for (let index = 0; index < rows.length; index += 1) {
        const row = rows[index];
        const object = Helpers.objectFromRow(headers, row);

        if (predicate(object, row, index + 2)) {
            return {
                rowIndex: index + 2,
                object,
                row
            };
        }
    }

    return null;
}

function append(sheet, row) {
    if (!sheet) {
        throw new Error('Planilha inválida.');
    }

    sheet.appendRow(row);
    return sheet.getLastRow();
}

function updateRow(sheet, rowIndex, row) {
    if (!sheet || rowIndex < 2) {
        throw new Error('Linha inválida para atualização.');
    }

    const columns = Math.max(sheet.getLastColumn(), row.length);
    sheet.getRange(rowIndex, 1, 1, columns).setValues([row]);
    return rowIndex;
}

function deleteRow(sheet, rowIndex) {
    if (!sheet || rowIndex < 2) {
        throw new Error('Linha inválida para exclusão.');
    }

    sheet.deleteRow(rowIndex);
}

function insertRows(sheet, rowIndex, quantity) {
    if (!sheet) {
        throw new Error('Planilha inválida.');
    }

    sheet.insertRows(rowIndex, quantity);
}

function clearData(sheet) {
    if (!sheet) {
        return;
    }

    const lastRow = sheet.getLastRow();
    const lastColumn = sheet.getLastColumn();

    if (lastRow < 2 || lastColumn < 1) {
        return;
    }

    sheet.getRange(2, 1, lastRow - 1, lastColumn).clearContent();
}

function setSheetTitle(sheet, title) {
    if (!sheet || !title) {
        return;
    }

    sheet.setName(title);
}
