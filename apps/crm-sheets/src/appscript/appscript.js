const COLOR_ROW_1                   = "#FFAA55"
const COLOR_ROW_2                   = "#FFD793"

const REMOVE_FILE_STRING            = "crm-sheet-"
const MAX_BOUNDS_COLUMS_COLORED     = 20
const MAIN_URL                      = "https://patrol-clubbing-alienate.ngrok-free.dev"
const MIN_HEIGHT_COLORED            = 5
const MIN_WIDTH_COLORED             = 5
let    
    sheet = {commom: null, fu1: null, fu2: null, fu3: null},
    filename,
    sheetType,
    username
;

SHEET_TYPE = Object.freeze({

  main: 1,
  user: 2,

});

SHEET_NAME = Object.freeze({

    commom: 'Empresas Cadastradas',
    fu1:    'FU1',
    fu2:    'FU2',
    fu3:    'FU3'
});

class Sheets
{
    constructor(name)
    {
        this.name  = name;
        this.ss = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
    }

    init(headerContent)
    {
        this.ss.setRowHeights(1, 50, 50);

        this.stripColor(1, 50, 26);

        const headerRange = this.ss.getRange(1, 1, 1, headerContent.length);

        headerRange.setValues([headerContent]);

        headerRange
            .setFontFamily("Arial")
            .setFontSize(12)
            .setHorizontalAlignment("center")
            .setVerticalAlignment("middle")
            .setWrap(true)
            .setFontWeight("bold")
            .setFontColor("#131313")
        ;

        this.resizeColumns();
    }

    stripColor(startRow, numRows, numCols)
    {
        if(numRows <= 0 || numCols <= 0) return;

        const colors = [];
        for (let i = 0; i < numRows; i++) {
            const currentRow = startRow + i;
            const color = (currentRow % 2 === 1) ? COLOR_ROW_1 : COLOR_ROW_2;
            colors.push(new Array(numCols).fill(color));
        }

        this.ss.getRange(startRow, 1, numRows, numCols).setBackgrounds(colors);
    }

    insertData(start, data)
    {    
        if(!data || data.length === 0) return 0;

        let matrix = [];
        const items = Array.isArray(data) ? data : Object.values(data);

        items.forEach(item => 
        {
            if (!item) return;

            // CASO 1: Veio do formulário (Array simples de valores)
            if(Array.isArray(item))
                matrix.push(item);
    
            else if (typeof item === 'object') 
            {
                matrix.push([
                    item.id || item.uid || item.LEADID || '',
                    item.name || item.company || item.EMPRESA || '',
                    item.email || item.EMAIL || '',
                    item.phone || item.TELEFONE || '',
                    item.website || item.SITE || '',
                    item.actfield || item.RAMO || '',
                    item.insight || item.INSIGHT || '',
                    item.service || item.SERVIÇO || '',
                    item.subscribers || item.subscriber || item.RESPONSÁVEL || '',
                ]);
            }
        });

        // Trata caso 'data' seja uma única linha simples de valores
        if (matrix.length === 0 && Array.isArray(data) && typeof data[0] !== 'object') {
            matrix = [data];
        }

        const row = matrix.length;
        if (row === 0) return 0;

        const col = matrix[0].length;
        if (col === 0) return 0;

        const targetRow = start <= 1 ? 2 : start;
        const targetRange = this.ss.getRange(targetRow, 1, row, col);

        targetRange.setValues(matrix);

        this.stripColor(targetRow, row + MIN_HEIGHT_COLORED, 26);

        targetRange
            .setFontFamily("Arial")
            .setFontSize(10)
            .setHorizontalAlignment("center")
            .setVerticalAlignment("middle")
            .setWrap(true);
        
        this.resizeColumns();
    }

    resizeColumns()
    {
        const col = this.ss.getLastColumn();
        const allValues = this.ss.getRange(1, 1, this.getRowCount(), col).getDisplayValues();

        for(let colIdx = 0; colIdx < col; colIdx++) 
        {
            let maxLen = 0;

            for(let rowIdx = 0; rowIdx < allValues.length; rowIdx++) 
            {
                const cellValue = String(allValues[rowIdx][colIdx] || "");

                if (cellValue.length > maxLen)
                    maxLen = cellValue.length;
            }

            const calculatedWidth = Math.min(Math.max(maxLen * 8.5, 110), 250);
            this.ss.setColumnWidth(colIdx + 1, calculatedWidth);
        }
    }

    updateData(row, data) 
    {
        if (!row || row < 2 || !data || data.length === 0) return;

        const matrix = Array.isArray(data[0]) ? data : [data];
        const numRows = matrix.length;
        const numCols = matrix[0].length;

        this.ss.getRange(row, 1, numRows, numCols).setValues(matrix);
    }

    getSelectedRow()
    {
        const activeCell = this.ss.getActiveCell();

        if(!activeCell) return [];

        const row = activeCell.getRow();
        const lastRow = this.ss.getLastRow();

        if (row < 2 || row > lastRow)return [];

        return this.ss.getRange(row, 1, 1, this.ss.getLastColumn()).getValues()[0];
    }

    getRowCount()
    {
        return this.ss.getLastRow();
    }

    clearMainContent()
    {
        const lastRow = this.ss.getLastRow();
        
        if(lastRow < 2) return;

        const range = this.ss.getRange(2, 1, this.ss.getLastRow(), this.ss.getLastColumn());
        range.clearContent();
    }
}

function onOpen() 
{
    initSheets();

    switch(sheetType)
    {
        case SHEET_TYPE.main:
        {
            SpreadsheetApp.getUi()
            .createMenu("BeeVolt")
                .addItem("Atualizar Dados", "loadSpreadSheet")
                .addItem("Nova Empresa",    "addSpreadSheet")
                .addItem("Editar Empresa",  "editSpreadSheet")
                .addItem("Restaurar Dados", "restoreSpreadSheet")
            .addToUi();

            break;
        }

        case SHEET_TYPE.user:
        {
            SpreadsheetApp.getUi()
            .createMenu("BeeVolt")
                .addItem("Atualizar Dados", "beecore.loadSpreadSheet")
                .addItem("Nova Empresa",    "beecore.addSpreadSheet")
                .addItem("Editar Empresa",  "beecore.editSpreadSheet")
            .addToUi();

            break;
        }
    }

    headerList = (sheetType === SHEET_TYPE.user) ?
    sheet.commom.init([ "LEADID", "EMPRESA", "EMAIL", "TELEFONE", "SITE", "RAMO DE ATIVIDADE", "INSIGHT", "SERVIÇO"]) :
    sheet.commom.init([ "LEADID", "EMPRESA", "EMAIL", "TELEFONE", "SITE", "RAMO DE ATIVIDADE", "INSIGHT", "SERVIÇO", "RESPONSÁVEL"]);
    
    sheet.fu1.init(["teste1", "teste2", "teste3"]);
    sheet.fu2.init(["teste4", "teste5", "teste6"]);
    sheet.fu3.init(["teste7", "teste8", "teste9"]);
}

function loadSpreadSheet() 
{
    initSheets() ;
    
    if(SpreadsheetApp.getActiveSpreadsheet().getActiveSheet().getName() !== SHEET_NAME.commom)
    {
        SpreadsheetApp
        .getUi()
            .alert(`Você só pode editar empresas na planilha principal ${SHEET_NAME.commom}!`);
        return;
    }

    let 
        res
    ;
    
    const leadid = sheet.commom.getRowCount() - 1;

    switch(username)
    {
        case 'main':
        {
            try
            {
                res = UrlFetchApp.fetch(
                `${MAIN_URL}/api/companies/?start=${leadid}&end=-1`,
                {
                    method: 'GET',
                    headers:
                    {
                        "ngrok-skip-browser-warning": "true"
                    }
                });
            }
            
            catch(error)
            {
                console.log(`Houve um erro! Motivo: ${error.toString()}`);
                SpreadsheetApp
                    .getUi()
                        .alert(`Houve um erro! Motivo: ${error.toString()}`);
            }

            break;
        }

        default:
        {
            try
            {
                res = UrlFetchApp.fetch(
                `${MAIN_URL}/api/companies/?sub=${encodeURIComponent(username)}`,
                {
                    method: 'GET',
                    headers:
                    {
                        "ngrok-skip-browser-warning": "true"
                    }
                });
            } 
            
            catch(error)
            {
                console.log(`Houve um erro! Motivo: ${error.toString()}`);
                SpreadsheetApp
                    .getUi()
                        .alert(`Houve um erro! Motivo: ${error.toString()}`);
            }
            
            break;
        }
    }

    const response = JSON.parse(res.getContentText());

    if(res.getResponseCode() == 400 || !response.success)
    {    
        SpreadsheetApp
        .getUi()
            .alert(`Houve um erro ao tentar se comunicar com o servidor! Motivo: ${response.error}.`);
        
        console.log(`Houve um erro ao tentar se comunicar com o servidor! Motivo: ${response.error}.`);

        return 0;
    }
    
    if(response.success) 
    {
        if(
            (sheetType == SHEET_TYPE.main && response.count == 0) ||
            (sheetType == SHEET_TYPE.user && response.count == (sheet.commom.getRowCount() - 1))
        )
        {
            SpreadsheetApp
            .getUi()
                .alert(`Planilha já está atualizada! Nenhuma empresa nova foi encontrada.`);

            return 1;
        }

        if(sheetType == SHEET_TYPE.user && response.count != (sheet.commom.getRowCount() - 1))
        {
           sheet.commom.clearMainContent();
           sheet.commom.insertData(2, response.data);

           return 1;
        }
    }

    sheet.commom.insertData(leadid, response.data);

    return 1;
}

function addSpreadSheet() 
{
    initSheets();
    
    if(SpreadsheetApp.getActiveSpreadsheet().getActiveSheet().getName() !== SHEET_NAME.commom)
    {
        SpreadsheetApp
        .getUi()
            .alert(`Você só pode adicionar empresas na planilha principal ${SHEET_NAME.commom}!`);
        return;
    }

    const res = UrlFetchApp.fetch(
    `${MAIN_URL}/api/employees`,
    {
        method: 'GET',
        headers:
        {
            "ngrok-skip-browser-warning": "true"
        }
    });

    const response = JSON.parse(res.getContentText());

    if(res.getResponseCode() == 400)
    {
        SpreadsheetApp
        .getUi()
            .alert(`Houve um erro ao tentar se comunicar com o servidor. Motivo: ${response.error}`);
        
        return;
    }

    const template      = HtmlService.createTemplateFromFile("forms");

    template.mode       = "add";
    template.user       = username;
    template.colabors   = response.data;
    template.company    = null;

    const html = template.evaluate().setWidth(1024).setHeight(720);

    const title = (sheetType === SHEET_TYPE.user) ? `${username} | Adicionar Empresa` : "Adicionar Empresa";

    SpreadsheetApp
    .getUi()
        .showModalDialog(html, title);
}

function editSpreadSheet() 
{
    initSheets();
    
    if(SpreadsheetApp.getActiveSpreadsheet().getActiveSheet().getName() !== SHEET_NAME.commom)
    {
        SpreadsheetApp
        .getUi()
            .alert(`Você só pode editar empresas na planilha principal ${SHEET_NAME.commom}!`);
        return;
    }

    const activeCell = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet().getActiveCell();

    const row = activeCell.getRow();

    if (!activeCell || row < 2) 
    {
        SpreadsheetApp.getUi().alert("Por favor, selecione uma linha válida!");
        return;
    }

    const rowData = sheet.commom.getSelectedRow();
    
    if(rowData.length === 0) 
    {
        SpreadsheetApp.getUi().alert("Por favor, selecione uma linha válida!");
        return;
    }

    const company = {
        row:        row,          
        uid:        rowData[0],   
        name:       rowData[1],
        email:      rowData[2],
        phone:      rowData[3],
        website:    rowData[4],
        actfield:   rowData[5],
        insight:    rowData[6],
        service:    rowData[7],
        subscribers: rowData[8]
    };
    const template      = HtmlService.createTemplateFromFile("forms");

    template.mode       = "edit";
    template.user       = (sheetType === SHEET_TYPE.user) ? username : 'main';
    template.colabors   = null;
    template.company    = company;

    const html = template.evaluate().setWidth(1024).setHeight(720);

    const title = (sheetType === SHEET_TYPE.user) ? `${username} | Editar Empresa` : "Editar Empresa";

    SpreadsheetApp
    .getUi()
        .showModalDialog(html, title);
}

function restoreSpreadSheet()
{
    initSheets();
    
    if(SpreadsheetApp.getActiveSpreadsheet().getActiveSheet().getName() !== SHEET_NAME.commom)
    {
        SpreadsheetApp
        .getUi()
            .alert(`Você só pode editar empresas na planilha principal ${SHEET_NAME.commom}!`);
        return;
    }

    let 
        res
    ;
    
    switch(username)
    {
        case 'main':
        {
            try
            {
                res = UrlFetchApp.fetch(
                `${MAIN_URL}/api/companies/?start=1&end=-1`,
                {
                    method: 'GET',
                    headers:
                    {
                        "ngrok-skip-browser-warning": "true"
                    }
                });
            }
            
            catch(error)
            {
                console.log(`Houve um erro! Motivo: ${error.toString()}`);
                SpreadsheetApp
                    .getUi()
                        .alert(`Houve um erro! Motivo: ${error.toString()}`);
            }

            break;
        }

        default:
        {
            break;
        }
    }

    if(res.getResponseCode() == 400)
    {
        const data = JSON.parse(res.getContentText());
        
        SpreadsheetApp
        .getUi()
            .alert(`Houve um erro ao tentar se comunicar com o servidor! Motivo: ${data.error}.`);
        
        console.log(`Houve um erro ao tentar se comunicar com o servidor! Motivo: ${data.error}.`);

        return 0;
    }

    const response = JSON.parse(res.getContentText());

    if(response.length === 0) return;

    sheet.commom.insertData(2, response.data);
}

function changeSheet(sheetName, operator, row, data)
{
    initSheets();

    const targetSheet = Object.values(sheet).find(s => s.name === sheetName);

    if(targetSheet)
    {
        if(operator === "insert")
        {
            const lastRow = targetSheet.getRowCount();
            const nextRow = lastRow < 1 ? 2 : lastRow + 1;

            const rowArray = [
                lastRow,                  // Coluna 1: UID
                data.name      || '',     // Coluna 2: Nome
                data.email     || '',     // Coluna 3: Email
                data.phone     || '',     // Coluna 4: Telefone
                data.website   || '',     // Coluna 5: Website
                data.actfield  || '',     // Coluna 6: Ramo de Atuação
                data.insight   || '',     // Coluna 7: Insight
                data.service   || '',     // Coluna 8: Serviço
                data.subscribers || ''    // Coluna 9: Colaborador/Inscrito
            ];

            targetSheet.insertData(nextRow, rowArray);
        }
        
        else if(operator === "edit")
        {
            const uid = Array.isArray(data) ? data[0] : (data.uid || row);

            const rowArray = Array.isArray(data) ? data : [
                uid,                     // Coluna A (1): UID (Mantém o mesmo)
                data.name       || '',   // Coluna B (2): Nome
                data.email      || '',   // Coluna C (3): Email
                data.phone      || '',   // Coluna D (4): Telefone
                data.website    || '',   // Coluna E (5): Website
                data.actfield   || '',   // Coluna F (6): Ramo de Atuação
                data.insight    || '',   // Coluna G (7): Insight
                data.service    || '',   // Coluna H (8): Serviço
                data.subscribers|| ''    // Coluna I (9): Colaborador / Responsável
            ];

            targetSheet.updateData(row + 1, rowArray);
        }
    }   
}

function BeeCore(action, ...args) 
{
    const routes = {
        "loadSpreadSheet": loadSpreadSheet,
        "addSpreadSheet":  addSpreadSheet,
        "editSpreadSheet": editSpreadSheet,
        "addCompany":      addCompany,
        "editCompany":     editCompany,
        "changeSheet":     changeSheet
    };

    if(routes[action]) 
        return routes[action](...args);
    
    throw new Error(`Ação '${action}' não encontrada no BeeCore.`);
}

function addCompany(data) 
{
    try 
    {
        const response = UrlFetchApp.fetch(
        `${MAIN_URL}/api/companies`,
        {
            method:         'POST',
            contentType:    "application/json",
            payload:        JSON.stringify(data),

            headers:
            {
                "ngrok-skip-browser-warning": "true"
            }
        });

        changeSheet('Empresas Cadastradas', 'insert', null, data);  

        const json = JSON.parse(response.getContentText());

        return json;
    }

    catch(error) 
    {
        return {
            success: false,
            message: "Houve um erro ao tentar se conectar ao servidor."
        };
    }
}

function editCompany(uid, data) 
{
    try 
    {
        const response = UrlFetchApp.fetch(
        `${MAIN_URL}/api/companies/?edit=${uid}`,
        {
            method:         'PUT',
            contentType:    "application/json",
            payload:        JSON.stringify(data),

            headers:
            {
                "ngrok-skip-browser-warning": "true"
            }
        });

        changeSheet('Empresas Cadastradas', 'edit', uid, data);

        const json = JSON.parse(response.getContentText());

        return json;
    }

    catch(error)
    {
        return {
            success: false,
            message: "Houve um erro ao tentar se conectar ao servidor."
        };
    }
}

function initSheets() 
{
    sheet.commom = new Sheets(SHEET_NAME.commom);
    sheet.fu1    = new Sheets(SHEET_NAME.fu1);
    sheet.fu2    = new Sheets(SHEET_NAME.fu2);
    sheet.fu3    = new Sheets(SHEET_NAME.fu3);

    if(!(Object.values(sheet).every(value => value !== null)))
    {
        SpreadsheetApp
        .getUi()
            .alert(`Houve um erro ao abrir as planilhas!\nAbra um ticket, URGENTE, para equipe de P&D no Discord!`);        
    }

    filename      = SpreadsheetApp.getActiveSpreadsheet().getName();
        
    const regex   = new RegExp(`${REMOVE_FILE_STRING}(.*)`);

    const matches = filename.match(regex);

    username      = matches ? matches[1].replace(/_/g, " ") : 'main';

    sheetType     = username === 'main' ? SHEET_TYPE.main : SHEET_TYPE.user;
} 
