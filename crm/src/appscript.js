const { use } = require("react")

const COLOR_1 =                     "#FFAA59"
const COLOR_2 =                     "#FFE3A5"
const COLOR_3 =                     "#FFD793"
const REMOVE_FILE_STRING =          "crm-sheet-"
const MAX_BOUNDS_COLUMS_COLORED =   20

let sheet_type = "none";
let user_name  = "none"

function onOpen() 
{
    const filename = SpreadsheetApp.getActiveSpreadsheet().getName();

    sheet_type = filename.includes(REMOVE_FILE_STRING) ? "user" : "main";
    
    if(sheet_type == "user")
    {
        user_name = filename.replace(REMOVE_FILE_STRING, "").replace("_", " ");
        SpreadsheetApp.getUi().createMenu("BeeVolt")
        .addItem("Atualizar Dados", "LoadUser")
        .addItem("Nova Empresa", "Add")
        .addItem("Editar Empresa", "Edit")
        .addToUi();
    }

    else if(sheet_type == "main")
    {
        user_name = "Usuário";
        SpreadsheetApp.getUi().createMenu("BeeVolt")
        .addItem("Atualizar Dados", "Load")
        .addItem("Nova Empresa", "Add")
        .addItem("Editar Empresa", "Edit")
        .addToUi();
    }

    ColourSheet(sheet, 5);
}

function ColourSheet(sheet, height) 
{
    for(let i = 1; i <= height + MAX_BOUNDS_COLUMS_COLORED; i++) 
    {
        const rowRange = sheet.getRange(i, 1, 1, width)

        if (i % 2)  rowRange.setBackground(COLOR_2);
        else        rowRange.setBackground(COLOR_3);
    }
}

function ClearSheet(sheet) 
{
    sheet.clear();
    sheet.setRowHeights(1, sheet.getMaxRows(), 21);

    ColourSheet(sheet, 0); 
}

function Load() 
{
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

    ClearSheet(sheet);

    const response = UrlFetchApp.fetch(
    `https://patrol-clubbing-alienate.ngrok-free.dev/dbget`,
    {
        headers:
        {
            "ngrok-skip-browser-warning": "true"
        }
    });

    if(response.getResponseCode() >= 400)
    {
        SpreadsheetApp.getUi().alert("Houve um erro ao tentar se comunicar com o servidor.\nTente novamente mais tarde.");
        return;
    }

    const companies = JSON.parse(response.getContentText());

    if(companies.length === 0) 
    {
        SpreadsheetApp.getUi().alert(`Não há empresas cadastradas no banco de dados. Avise um membro do setor de P&D imediantamente!`);
        return;
    }

    BuildMainSheet(sheet, companies);
}

function LoadUser() 
{
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

    let subscriber = filename.replace(REMOVE_FILE_STRING, "").replace("_", " ");

    ClearSheet(sheet);

    const response = UrlFetchApp.fetch(
    `https://patrol-clubbing-alienate.ngrok-free.dev/companys/${subscriber}`,
    {
        headers:
        {
            "ngrok-skip-browser-warning": "true"
        }
    });

    if(response.getResponseCode() >= 400)
    {
        SpreadsheetApp.getUi().alert("Houve um erro ao tentar se comunicar com o servidor.\nTente novamente mais tarde.");
        return;
    }

    const companies = JSON.parse(response.getContentText());

    if (companies.length === 0) 
    {
        SpreadsheetApp.getUi().alert(`${user_name}, não há empresas cadastradas no seu nome. Adicione uma empresa primeiro!`);
        return;
    }

    BuildMainSheet(sheet, companies)
}

function Add() 
{
    const template      = HtmlService.createTemplateFromFile("forms");

    template.mode       = "add";
    template.user       = (sheet_type === 'user') ? user_name : null;
    template.colabors   = GetColaborList();
    template.company    = null;

    const html = template.evaluate().setWidth(1024).setHeight(720);

    const title = (sheet_type === 'user') ? `Formulário de ${user_name} | Adicionar Empresa` : "Adicionar Empresa";

    SpreadsheetApp.getUi().showModalDialog(html, title);
}

function Edit() 
{
    const template      = HtmlService.createTemplateFromFile("forms");

    template.mode       = "edit";
    template.user       = (sheet_type === 'user') ? user_name : null;
    template.colabors   = null;
    template.company    = GetSelectedCompany();

    if(Object.keys(template.company).length === 0) 
    {
        SpreadsheetApp.getUi().alert("Selecione uma linha que contenha uma empresa válida!");
        return;
    }

    const html = template.evaluate().setWidth(1024).setHeight(720);


    const title = (sheet_type === 'user') ? `Formulário de ${user_name} | Editar Empresa` : "Editar Empresa";

    SpreadsheetApp.getUi().showModalDialog(html, title);
}

function GetColaborList() 
{
    const response = UrlFetchApp.fetch(
    "https://patrol-clubbing-alienate.ngrok-free.dev/subscribers",
    {
        headers:
        {
            "ngrok-skip-browser-warning": "true"
        }
    });

    if(response.getResponseCode() >= 400)
    {
        SpreadsheetApp.getUi().alert("Houve um erro ao tentar se comunicar com o servidor.\nTente novamente mais tarde.");
        return;
    }

    return JSON.parse(response.getContentText());
}

function GetSelectedCompany() 
{
    const sheet     = SpreadsheetApp.getActiveSheet();
    const row       = sheet.getActiveCell().getRow();
    const lastRow   = sheet.getLastRow();

    if (row < 2 || row > lastRow) return {};
    
    const data = sheet.getRange(row, 1, 1, sheet.getLastColumn()).getValues()[0];

    return {
        uid: row - 1,
        name: data[0],
        email: data[1],
        phone: data[2],
        website: data[3],
        actfield: data[4],
        insight: data[5],
        services: data[6]
    };
}

function AddCompany(data) 
{
    try 
    {
        const response = UrlFetchApp.fetch(
        "https://patrol-clubbing-alienate.ngrok-free.dev/addcompy",
        {
            method:         "post",
            contentType:    "application/json",
            payload:        JSON.stringify(data),

            headers:
            {
                "ngrok-skip-browser-warning": "true"
            }
        });

        const json = JSON.parse(response.getContentText());

        return json;
    }

    catch (error) 
    {
        return {
            success: false,
            message: "Houve um erro ao tentar se conectar ao servidor. Avise um membro do setor de P&D imediantamente!"
        };
    }
}

function EditCompany(uid, data) 
{
    try 
    {
        const response = UrlFetchApp.fetch(
        `https://patrol-clubbing-alienate.ngrok-free.dev/updatecompany/${uid}`,
        {
            method:         "post",
            contentType:    "application/json",
            payload:        JSON.stringify(data),

            headers:
            {
                "ngrok-skip-browser-warning": "true"
            }
        });

        const json = JSON.parse(response.getContentText());

        return json;
    }

    catch (error)
    {
        return {
            success: false,
            message: "Houve um erro ao tentar se conectar ao servidor. Avise um membro do setor de P&D imediantamente!"
        };
    }
}

function BuildMainSheet(sheet, companies) 
{
    const headers = Object.keys(companies[0]);

    const values = [];

    values.push(headers);

    companies.forEach(company => 
    {
        values.push(headers.map(header => company[header]));
    });

    const width = values[0].length;
    const height = values.length;

    const range = sheet.getRange(1, 1, height, width);

    range.setValues(values);

    sheet.setName("Empresas Cadastradas");
    sheet.setRowHeights(1, 1, 25);
    sheet.setRowHeights(2, height - 1, 50);

    const header_range = sheet.getRange(1, 1, 1, width)
    const texts_range  = sheet.getRange(1, 5, height, 7)

    range.setFontFamily("Arial")
    range.setFontSize(10)
    range.setHorizontalAlignment("center")
    range.setVerticalAlignment("middle")
    range.setWrap(false)
    range.setBorder(true, true, true, true, true, true)

    header_range.setBackground(COLOR_1);
    header_range.setFontWeight("bold")
    header_range.setFontSize(12)

    texts_range.setWrap(true)

    headers.forEach((header, colIndex) => 
    {
        let maxLength = header.length;

        companies.forEach(company => 
        {
            const text = String(company[header] || "");

            if (text.length > maxLength) maxLength = text.length;
        });

        const width_aprox = Math.min(Math.max(maxLength * 7.5, 80), 260);

        sheet.setColumnWidth(colIndex + 1, width_aprox);
    });

    ColourSheet(sheet, height);
}