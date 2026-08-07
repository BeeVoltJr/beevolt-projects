import express  from 'express';
import cors     from 'cors';

import { 
    beedb,
    GetCompaniesFromInterval,
    GetCompaniesFromSubs,
    GetAllEmployees,
    GetCompanyFromUID,
    AddCompany,
    UpdateCompany

}   from './database.js';

import { 

    LOG_TYPE,
    SendDiscordLog,
    SendConsoleLog, 
    SendConsoleErr,
    SendConsoleWarn,
    SendConsoleDebug 

} from './logs.js';

export const beeapp = express();

beeapp.use(cors());
beeapp.use(express.json());

beeapp.listen(3000, async (err) => {});

beeapp.use((req, res, next) =>
{
    // console.log(`\n[${new Date().toISOString()}] ${req.method} ${req.url}`);

    // if(req.method === "POST" || req.method === "PUT")
    //     console.log("data: ", req.body);
    
    next();
});

beeapp.get("/api/companies", OnRequestCompanies);

export async function OnRequestCompanies(req, res) 
{
    try
    {
        let   start      = parseInt(req.query.start, 10);
        let   end        = parseInt(req.query.end, 10);
        const subscriber = req.query.sub || 'none';

        start   = isNaN(start) ? 0 : start;
        end     = isNaN(end)   ? -1 : end;

        let payload = [];

        if(subscriber === 'none' && !isNaN(start) && !isNaN(end))
            payload = await GetCompaniesFromInterval(start, end);
        
        else if(subscriber != 'none' && isNaN(start) && isNaN(end))
            payload = await GetCompaniesFromSubs(subscriber);
        
        else
        {
            return res.status(400).json(
            { 
                success: false, 
                error: 'Parâmetros de consulta inválidos. Forneça um intervalo ou um colaborador' 
            });
        }

        return res.json({ success: true, count: payload.length,  data: payload });
    }

    catch(err)
    {
        console.error('[ ERRO ] Falha ao processar OnRequestCompanies:', err);

        return res.status(500).json(
        { 
            success: false, 
            error: 'Falha ao buscar empresas no banco de dados.' 
        });
    } 
}

beeapp.get("/api/employees", OnRequestEmployees);

export async function OnRequestEmployees(req, res) 
{
    try
    {
        const name = req.query.name || 'none';
        const uid  = parseInt(req.query.uid, 10);

        let payload = [];

        if(name != 'none' && isNaN(uid))
        {
            payload = await GetEmployeeFromName(name);
        }

        else if(name === 'none' && !isNaN(uid) && uid > 0)
        {
            payload = await GetEmployeeFromUID(uid);
        }

        else if(name === 'none' && isNaN(uid))
        {
            payload = await GetAllEmployees();
        }

        else
        {
            return res.status(400).json(
            { 
                success: false, 
                error: 'Parâmetros de consulta inválidos.' 
            });
        }

        return res.json({ success: true, count: payload.length,  data: payload });
    }

    catch(err)
    {
        console.error('[ ERRO ] Falha ao processar OnRequestEmployees:', err);

        return res.status(500).json(
        { 
            success: false, 
            error: 'Falha ao buscar colaboradores no banco de dados.' 
        });
    } 
}

beeapp.post("/api/companies", OnAddCompany);

beeapp.put("/api/companies", OnUpdateCompany);

export async function OnAddCompany(req, res) 
{
    try 
    {
        const companyData = req.body;

        if (!companyData || !companyData.name) 
        {
            return res.status(400).json({
                success: false,
                message: 'O nome da empresa é obrigatório.'
            });
        }

        const result = await AddCompany(companyData);

        if(!result.success) 
        {
            SendConsoleErr("NECKTAR TRACK", `Erro ao adicionar empresa: ${result.reason}`);

            return res.status(500).json({
                success: false,
                message: 'Houve um erro no servidor interno ao cadastrar a empresa.',
                error: result.reason
            });
        }

        const addedCompany = await GetCompanyFromUID(result.lastID);
        const compName = addedCompany ? addedCompany.name : companyData.name;
        const subscriber = addedCompany ? addedCompany.subscribers : companyData.subscribers;

        SendConsoleWarn("NECKTAR TRACK", `A empresa ${compName} [ LID: ${result.lastID} ] foi adicionada por ${subscriber}`);
        
        SendDiscordLog(
            LOG_TYPE.warn, 
            `A empresa \`\`\`${compName} [ LID: ${result.lastID} ]\`\`\` foi adicionada por \`\`\`${subscriber}\`\`\``
        );

        return res.status(201).json({
            success: true,
            message: 'Empresa cadastrada com sucesso!',
            id: result.lastID
        });
    } 
    
    catch(err) 
    {
        SendConsoleErr("NECKTAR TRACK", `Falha crítica ao processar OnAddCompany: ${err.message || err}`);

        return res.status(500).json({
            success: false,
            message: 'Houve um erro no servidor interno. Avise o setor de P&D imediatamente!'
        });
    }
}

export async function OnUpdateCompany(req, res) 
{
    try 
    {
        const uid = parseInt(req.query.edit || req.query.uid, 10);
        const updateData = req.body;

        console.log(`[ OnUpdateCompany ] UID: ${uid}, UpdateData:`, updateData);

        if(isNaN(uid) || uid <= 0) 
        {
            return res.status(400).json({
                success: false,
                message: 'Identificador (UID) da empresa inválido ou ausente.'
            });
        }

        if(!updateData || Object.keys(updateData).length === 0) 
        {
            return res.status(400).json({
                success: false,
                message: 'Você precisa alterar algum campo antes de enviar novos dados!'
            });
        }

        const result = await UpdateCompany(uid, updateData);

        if (!result.success) 
        {
            SendConsoleErr("NECKTAR TRACK", `Erro ao atualizar empresa UID ${uid}: ${result.reason}`);
            return res.status(500).json({
                success: false,
                message: 'Houve um erro ao atualizar os dados no servidor.',
                error: result.reason
            });
        }

        const updatedCompany = await GetCompanyFromUID(uid);
        const compName = updatedCompany ? updatedCompany.name : 'Empresa';
        const subscriber = updatedCompany ? updatedCompany.subscribers : 'Sistema';

        SendConsoleWarn("NECKTAR TRACK", `A empresa ${compName} [ LID: ${uid} ] foi atualizada por ${subscriber}`);

        SendDiscordLog(
            LOG_TYPE.warn, 
            `A empresa \`\`\`${compName} [ LID: ${uid} ]\`\`\` foi atualizada por \`\`\`${subscriber}\`\`\``
        );

        return res.json({
            success: true,
            message: 'Dados atualizados com sucesso!',
            changes: result.changes
        });
    } 
    
    catch(err) 
    {
        SendConsoleErr("NECKTAR TRACK", `Falha crítica ao processar OnUpdateCompany: ${err.message || err}`);
        return res.status(500).json({
            success: false,
            message: 'Houve um erro no servidor interno. Avise o setor de P&D imediatamente!'
        });
    }
}