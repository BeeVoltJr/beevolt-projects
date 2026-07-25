import util    from 'node:util';
import sqlite3 from 'sqlite3';

const database = new sqlite3.Database('./database/beedb.db');

export class Database 
{
    constructor(Instance) 
    {
        this.db = Instance;
    }

    _va_format(where, params) 
    {
        if(params.length > 0 && /%[sdifjO%]/.test(where)) 
            return util.format(where, ...params);

        return where;
    }

    //WRAPPER (Análogos aos hooks de funções no pawn)

    async get(query, ...params) 
    {
        return new Promise((resolve, reject) => 
        {
            this.db.get(query, params, (err, row) => 
            {
                if(err) 
                {
                    console.error(`[ DB ERR ] ${query} ->`, err);
                    return resolve(err);
                }
            
                resolve(row || null);
            });
        });
    }

    async all(query, ...params) 
    {
        return new Promise((resolve, reject) => 
        {
            this.db.all(query, params, (err, rows) => 
            {
                if(err) 
                {
                    console.error(`[ DB ERR ] ${query} ->`, err);
                    return resolve(err);
                }
            
                resolve(rows || []);
            });
        });
    }

    async run(query, ...params) 
    {
        return new Promise((resolve, reject) => 
        {
            this.db.run(query, params, function (err) 
            {
                if(err) 
                {
                    console.error(`[ DB ERR ] ${query} ->`, err);
                    return resolve(err);
                }
                
                resolve({ success: true, changes: this.changes, lastID: this.lastID });
            });
        });
    }

    /* =========================================================================
    *                  FUNÇÕES UTILITÁRIAS (MESMAS DO MEU ANTIGO PWN)
    * ========================================================================= */

    // DB::CreateTable
    async createTable(table, definition) 
    {
        const result = await this.run(`CREATE TABLE IF NOT EXISTS ${table} (${definition});`);

        if(result.success) 
            console.log(`[ DB ] Tabela '${table}' criada com sucesso.`);

        return result.success;
    }

    // DB::GetCount
    async getCount(table, where = "", ...params) 
    {
        const query = where ? `SELECT COUNT(*) AS total FROM ${table} WHERE ${where}` : `SELECT COUNT(*) AS total FROM ${table}`;
        
        const row = await this.get(query, ...params);

        return (row ? row.total : 0);
    }

    // DB::Exists
    async exists(table, where = "", ...params) 
    {
        const count = await this.getCount(table, where, ...params);
    
        return (count > 0);
    }

    // DB::Insert
    async insert(table, fields, valuesArray) 
    {
        // Cria os placeholders '?, ?, ?' dinamicamente conforme a quantidade de valores
        const placeholders = valuesArray.map(() => '?').join(', ');

        const result = await this.run(`INSERT INTO ${table} (${fields}) VALUES (${placeholders});`, ...valuesArray);
        
        return result.success; // Retorna se houve ou não sucesso no insert
    }

    // DB::Update
    async update(table, setClause, whereClause = "", ...params) 
    {    
        const query = whereClause ? `UPDATE ${table} SET ${setClause} WHERE ${whereClause};` : `UPDATE ${table} SET ${setClause};`;
        
        const result = await this.run(query, ...params);
        
        return result.changes; // Retorna a quantidade de linhas afetadas
    }

    // DB::Delete
    async delete(table, whereClause, ...params) 
    {
        if(!whereClause) return false; // Medida de segurança

        const result = await this.run(`DELETE FROM ${table} WHERE ${whereClause};`, ...params);

        return result.success; // Retorna se houve ou não sucesso no delete
    }

    // DB::GetDataInt / DB::GetDataFloat / DB::GetDataString (unificados no javascript)
    async getValue(table, field, whereClause, ...params) 
    {
        const query = `SELECT ${field} FROM ${table} WHERE ${whereClause} LIMIT 1;`;

        const row = await this.get(query, ...params);
    
        return row ? row[field] : null;
    }

    // DB::SetDataInt / DB::SetDataFloat / DB::SetDataString (unificados no javascript)
    async setValue(table, field, value, whereClause, ...params) 
    {
        const query = `UPDATE ${table} SET ${field} = ? WHERE ${whereClause};`;

        const result = await this.run(query, value, ...params);

        return result.success;
    }

    // Nova função que receberá um conjunto de dados json de uma consulta query
    async getValues(table, field, whereClause, ...params) 
    {
        const query = `SELECT ${field} FROM ${table} WHERE ${whereClause};`

        const rows = await this.all(query, ...params);

        return rows;
    }
}

export const beedb = new Database(database);
