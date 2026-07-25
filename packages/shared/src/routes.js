import express  from 'express';
import cors     from 'cors';
import { beedb }   from './database.js';

export const beeapp = express();

beeapp.use(cors());
beeapp.use(express.json());

beeapp.listen(3000, async (err) => 
{
    if(err)
    {
        console.error(err);
        SendSystemLog("NECTAR TRACK 🍯🐝", "ERROR", `Houve um erro ao carregar o sistema`);

        return;
    }

    console.log("Bee Volt CRM iniciado...\n");

    const company_count = await beedb.getCount('companies');
    const employee_count = await beedb.getCount('employees');;

    console.log(`Total de empresas: ${company_count}`);
    console.log(`Total de colaboradores: ${employee_count}`);

    // SendSystemLog("NECTAR TRACK 🍯🐝", "DEBUG", 
    
    // `\`\`\`O sistema foi inicializado com sucesso!\n\n` +
    // `• ${company_count} empresas carregadas\n` +
    // `• ${employee_count} calaboradores carregados\`\`\``

    // );
});

beeapp.use((req, res, next) =>
{
    console.log(`\n[${new Date().toISOString()}] ${req.method} ${req.url}`);

    if(req.method === "POST" || req.method === "PUT")
        console.log("data: ", req.body);
    
    next();
});

beeapp.get("/companies/:subscribers", async (req, res) => 
{
    try
    {
        const result = await beedb.getValues
        (
            'companies', 
            
            "COALESCE(uid,      'NULL') AS \"leadid\",\
            COALESCE(name,      'NULL') AS \"Empresa\",\
            COALESCE(email,     'NULL') AS \"Email\",\
            COALESCE(phone,     'NULL') AS \"Telefone\",\
            COALESCE(website,   'NULL') AS \"Site\",\
            COALESCE(actfield,  'NULL') AS \"AreaEmpresa\",\
            COALESCE(insight,   'NULL') AS \"InsightEmpresa\",\
            COALESCE(service,   'NULL') AS \"ServicoPrincipal\"",
            
            "subscribers = ?", req.params.subscribers
        );

        return res.json(result);
    }

    catch(err)
    {
        console.error(`\n[${new Date().toISOString()}] ${err}`);
        return res.status(500).json(err);
    }
});

beeapp.get("/dbget", (req, res) =>
{

    beedb.all(
        "SELECT COALESCE(uid,         'NULL') AS \"leaduid\",\
                COALESCE(name,        'NULL') AS \"name\",\
                COALESCE(email,       'NULL') AS \"email\",\
                COALESCE(phone,       'NULL') AS \"phone\",\
                COALESCE(website,     'NULL') AS \"website\",\
                COALESCE(actfield,    'NULL') AS \"actfield\",\
                COALESCE(insight,     'NULL') AS \"insight\",\
                COALESCE(service,     'NULL') AS \"service\",\
                COALESCE(subscribers, 'NULL') AS \"subscribers\"\
                FROM companies",
    
    (err, rows) => 
    {
        
        if(err) 
        {
            console.error(`\n[${new Date().toISOString()}] ${err}`);
            return res.status(500).json(err);
        }

        res.json(rows);
    });
});

beeapp.get("/employget", (req, res) =>
{
    beedb.all(`SELECT DISTINCT name FROM employees ORDER BY name ASC`,
    
    (err, rows) =>
    {
        if(err)
            return res.status(500).json(err);
        
        res.json(rows);
        console.log(rows);
    });
});

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


