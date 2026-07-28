import express  from 'express';
import cors     from 'cors';

import { 
    beedb,

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
    console.log(`\n[${new Date().toISOString()}] ${req.method} ${req.url}`);

    if(req.method === "POST" || req.method === "PUT")
        console.log("data: ", req.body);
    
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

        let payload = [];

        if(subscriber === 'none' && !isNaN(start) && !isNaN(end))
        {
            start = start == 0 ? 1 : start;
            end = end < 0 ? await beedb.getCount('companies') : end;

            payload = await GetCompaniesFromInterval(start, end);
        }

        else if(subscriber != 'none' && isNaN(start) && isNaN(end))
        {
            payload = await GetCompaniesFromSubs(subscriber);
        }

        else
        {
            return res.status(400).json(
            { 
                success: false, 
                error: 'Parâmetros de consulta inválidos. Forneça um intervalo OU um colaborador' 
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

beeapp.post("/addcomp", (req, res) =>
{
    try
    {
        const company = req.body;
    
        beedb.run(`INSERT INTO 
            companies(name, email, phone, website, actfield, insight, service, subscribers)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
            
            [
                company.name,    company.email,    company.phone, 
                company.website, company.actfield, company.insight, 
                company.service, company.subscribers
            ],

        function(err)
        {
            if (err)
            {
                console.error(`\n[${new Date().toISOString()}] ${err}`);

                return res.json(
                {
                    success: false,
                    message:"Houve um erro no servidor interno. Avise o setor de P&D imediatamente!"
                });
            }

            beedb.get(`SELECT uid, name, subscribers FROM companies WHERE name = '${company.name}'`, (err, row) =>
            {
                if(err)
                {
                    console.error(`\n[${new Date().toISOString()}] ${err}`);
                    return;
                }

                SendSystemLog("NECTAR TRACK 🍯🐝", "WARN", `A empresa \`\`\`${row.name} [ LID: ${row.uid} ]\`\`\` foi adicionada por \`\`\`${row.subscribers}\`\`\``);
                
                console.warn(`\n[${new Date().toISOString()}] A empresa ${row.name} (${row.uid}) foi adicionada!`);
            });

            return res.json(
            {
                success: true,
                id: this.lastID
            });
        });
    }

    catch(error)
    {
        return res.json(
        {
            success: false,
            message: "Houve um erro no servidor interno. Avise o setor de P&D imediatamente!"
        });
    }
});

beeapp.post("/updatecomp/:id", (req, res) =>
{
    const uid   = req.params.id;
    const data  = req.body;

    if(Object.keys(data).length === 0)
    {
        return res.json(
        {
            success: false,
            message: "Você precisa alterar algum campo antes de tentar enviar novos dados!"
        });
    }

    const fields    = Object.keys(data);  

    const setClause = fields.map(field => `${field} = ?`).join(", ");

    const values    = [...fields.map(field => data[field])];
   
    beedb.run(`UPDATE companies SET ${setClause} WHERE uid = ${uid}`, values,

    function(err)
    {
        if(err)
        {
            console.error(`\n[${new Date().toISOString()}] ${err}`);

            return res.json(
            {
                success: false,
                message: "Houve um erro ao atualizar os dados. Avise o setor de P&D imediatamente!"
            });
        }
     
        return res.json(
        {
            success: true,
            changes: this.changes
        });
    });

    beedb.get(`SELECT name, subscribers FROM companies WHERE uid = ${uid}`, (err, row) =>
    {
        if(err)
        {
            console.error(`\n[${new Date().toISOString()}] ${err}`);
            return;
        }

        SendSystemLog("NECTAR TRACK 🍯🐝", "WARN", `A empresa \`\`\`${row.name} [ LID: ${uid} ]\`\`\` foi atualizada por \`\`\`${row.subscribers}\`\`\``);
                
        console.warn(`\n[${new Date().toISOString()}] A empresa ${row.name} (${uid}) foi atualizada!`);
    });
});


