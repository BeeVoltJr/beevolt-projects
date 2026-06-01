const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors    = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

const db = new sqlite3.Database("./scriptfiles/beedb.db");

app.get("/", (req, res) => {
    res.send("API funcionando");
});

app.get("/companys/:sub", (req, res) => {

    const subscribers = req.params.sub;

    db.all(
        "SELECT COALESCE(name, 'N/A') AS \"Empresa\",\
                COALESCE(email, 'N/A') AS \"Email\",\
                COALESCE(phone, 'N/A') AS \"Telefone\",\
                COALESCE(website, 'N/A') AS \"Site\",\
                COALESCE(actfield, 'N/A') AS \"AreaEmpresa\",\
                COALESCE(insight, 'N/A') AS \"InsightEmpresa\",\
                COALESCE(service, 'N/A') AS \"ServicoPrincipal\" FROM companys WHERE subscribers = ?",

        [subscribers],
        (err, rows) => {

            if(err) {
                return res.status(500).json(err);
            }

            res.json(rows);
        }
    );
});

app.get("/dbget", (req, res) => {

    db.all(
        "SELECT COALESCE(name, 'N/A') AS \"name\",\
                COALESCE(email, 'N/A') AS \"email\",\
                COALESCE(phone, 'N/A') AS \"phone\",\
                COALESCE(website, 'N/A') AS \"website\",\
                COALESCE(actfield, 'N/A') AS \"actfield\",\
                COALESCE(insight, 'N/A') AS \"insight\",\
                COALESCE(service, 'N/A') AS \"service\",\
                COALESCE(subscribers, 'N/A') AS \"subscribers\" FROM companys",
        (err, rows) => {

            if(err) {
                return res.status(500).json(err);
            }

            res.json(rows);
        }
    );
});

app.post("/addcompy", (req, res) =>
{
  try
  {
    const company =
      req.body;
    
    console.log(company);

    db.run(
      `
      INSERT INTO companys
      (
        name,
        email,
        phone,
        website,
        actfield,
        insight,
        service,
        subscribers
      )

      VALUES (?, ?, ?, ?, ?, ?, ?, ?);
      `,
      [
        company.name,
        company.email,
        company.phone,
        company.website,
        company.actfield,
        company.insight,
        company.service,
        company.subscribers
      ],

      function(err)
      {
        if (err)
        {
          return res.json({
            success: false,
            message:
              "Erro ao salvar empresa."
          });
        }

        return res.json({
          success: true,
          id: this.lastID
        });
      }
    );
  }

  catch(error)
  {
    return res.json({
      success: false,
      message:
        "Erro interno servidor."
    });
  }
});

app.post("/updatecompany/:id", (req, res) =>
{
    const id = req.params.id;
    const data = req.body;

    if (Object.keys(data).length === 0)
    {
        return res.json({
            success: false,
            message: "Nenhum campo enviado."
        });
    }

    const fields = Object.keys(data);

    const setClause =
        fields.map(field => `${field} = ?`).join(", ");

    const values =
        [...fields.map(field => data[field]), id];

    db.run(
        `
        UPDATE companys
        SET ${setClause}
        WHERE uid = ?
        `,
        values,
        function(err)
        {
            if (err)
            {
                console.error(err);

                return res.json({
                    success: false,
                    message: "Erro ao atualizar."
                });
            }

            return res.json({
                success: true,
                changes: this.changes
            });
        }
    );
});

app.get("/subscribers", (req, res) =>
{
    db.all(
        `
        SELECT DISTINCT subscribers
        FROM companys
        WHERE subscribers IS NOT NULL
          AND subscribers <> ''
          AND subscribers <> 'N/A'
        ORDER BY subscribers
        `,
        [],
        (err, rows) =>
        {
            if (err)
            {
                return res.status(500).json(err);
            }

            res.json(rows);
        }
    );
});

app.listen(3000, () => {
    console.log("Servidor rodando");
});
