const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors    = require("cors");
const app     = express();

app.use(cors());
app.use(express.json());

const db = new sqlite3.Database("./database/beedb.db");

app.listen(3000, async (err) => 
{
    if(err)
    {
        console.error(err);
        SendSystemLog("NECTAR TRACK 🍯🐝", "ERROR", `Houve um erro ao carregar o sistema`);

        return;
    }

    console.log("Bee Volt CRM iniciado...\n");

    const company_count = await GetCompanyCount();
    const employee_count = await GetEmployeeCount();

    console.log(`Total de empresas: ${company_count}`);
    console.log(`Total de colaboradores: ${employee_count}`);

    SendSystemLog("NECTAR TRACK 🍯🐝", "DEBUG", 
    
    `\`\`\`O sistema foi inicializado com sucesso!\n\n` +
    `• ${company_count} empresas carregadas\n` +
    `• ${employee_count} calaboradores carregados\`\`\``

    );
});

app.use((req, res, next) =>
{
    console.log(`\n[${new Date().toISOString()}] ${req.method} ${req.url}`);

    if(req.method === "POST" || req.method === "PUT")
        console.log("data: ", req.body);
    
    next();
});

app.get("/companies/:subscribers", (req, res) => 
{
    const subscribers = req.params.subscribers;

    db.all(
        "SELECT COALESCE(uid,       'NULL') AS \"leadid\",\
                COALESCE(name,      'NULL') AS \"Empresa\",\
                COALESCE(email,     'NULL') AS \"Email\",\
                COALESCE(phone,     'NULL') AS \"Telefone\",\
                COALESCE(website,   'NULL') AS \"Site\",\
                COALESCE(actfield,  'NULL') AS \"AreaEmpresa\",\
                COALESCE(insight,   'NULL') AS \"InsightEmpresa\",\
                COALESCE(service,   'NULL') AS \"ServicoPrincipal\"\
                FROM companies WHERE subscribers = ?",

    [subscribers],

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

app.get("/dbget", (req, res) =>
{

    db.all(
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

app.get("/employget", (req, res) =>
{
    db.all(`SELECT DISTINCT name FROM employees ORDER BY name ASC`,
    
    (err, rows) =>
    {
        if(err)
            return res.status(500).json(err);
        
        res.json(rows);
        console.log(rows);
    });
});

app.post("/addcomp", (req, res) =>
{
    try
    {
        const company = req.body;
    
        db.run(`INSERT INTO 
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

            db.get(`SELECT uid, name, subscribers FROM companies WHERE name = '${company.name}'`, (err, row) =>
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

app.post("/updatecomp/:id", (req, res) =>
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
   
    db.run(`UPDATE companies SET ${setClause} WHERE uid = ${uid}`, values,

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

    db.get(`SELECT name, subscribers FROM companies WHERE uid = ${uid}`, (err, row) =>
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

function GetCompanyCount()
{
    return new Promise((resolve, reject) =>
    {
        db.get(
            "SELECT COUNT(*) AS count FROM companies",
            (err, row) =>
            {
                if(err) reject(err);
                else resolve(row.count);
            }
        );
    });
}

function GetEmployeeCount()
{
    return new Promise((resolve, reject) =>
    {
        db.get(
            "SELECT COUNT(*) AS count FROM employees",
            (err, row) =>
            {
                if(err) reject(err);
                else resolve(row.count);
            }
        );
    });
}

async function SendSystemLog(log_sysname, log_type, log_msg)
{
    let log_title, log_color;

    switch(log_type)
    {
        case "ERROR": 
        {
            log_title = "ERRO";
            log_color = Number("0xFF5555");
            break;
        }
        case "WARN":
        {
            log_title = "AVISO";
            log_color = Number("0xFFFF55");
            break;
        }

        case "DEBUG":
        {
            log_title = "DEBUG";
            log_color = Number("0x55FF55");
            break;
        }
    }

    await fetch(
        "http://localhost:4000/internal/log",
        {
            method: "POST",
            headers:
            {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({

                title:      log_title,
                color:      log_color,
                sysname:    `\`\`\`${log_sysname}\`\`\``,
                msg:        `${log_msg}`,
                date:       `\`\`\`${new Date().toLocaleString()}\`\`\``
            })
        }
    );
}
