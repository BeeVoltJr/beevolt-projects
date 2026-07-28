import util    from 'node:util';
import sqlite3 from 'sqlite3';

const database = new sqlite3.Database('./database/beedb.db');

export class Database 
{
    constructor(Instance) 
    {
        this.db = Instance;
    }

    // WRAPPERS

    async get(sql, params = []) 
    {
        return new Promise((resolve, reject) => 
        {
            this.db.get(sql, params, (err, row) => 
            {
                if(err) 
                    return reject({ error: err, query: sql, params });
                
                resolve(row || null);
            });
        });
    }

    async all(sql, params = []) 
    {
        return new Promise((resolve, reject) => 
        {
            this.db.all(sql, params, (err, rows) => 
            {
                if(err) 
                    return reject({ error: err, query: sql, params });

                resolve(rows || []);
            });
        });
    }

    async run(sql, params = []) 
    {
        return new Promise((resolve, reject) => 
        {
            this.db.run(sql, params, function (err) 
            {
                if(err) 
                    return reject({ error: err, query: sql, params });
                
                resolve({ success: true, changes: this.changes, lastID: this.lastID });
            });
        });
    }

    async createTable(table, definition) 
    {
        try 
        {
            await this.run(`CREATE TABLE IF NOT EXISTS ${table} (${definition});`);
            console.log(`[ DB ] Tabela '${table}' criada com sucesso.`);
            return true;
        } 

        catch (err) 
        {
            console.error(`[ ERRO DB ] Erro ao criar tabela '${table}'\nQUERY: ${err.query}`);
            return false;
        }
    }

    async getCount(table, where = "", ...params) 
    {
        try 
        {
            const sql = where 
                ? `SELECT COUNT(*) AS total FROM ${table} WHERE ${where}` 
                : `SELECT COUNT(*) AS total FROM ${table}`;
            
            const row = await this.get(sql, params.flat(Infinity));

            return row ? row.total : 0;
        } 

        catch(err) 
        {
            console.error(`[ ERRO DB ] Falha no método 'getCount' na tabela '${table}':`, err.error);
            return 0;
        }
    }

    async exists(table, where, ...params) 
    {
        const count = await this.getCount(table, where, ...params);
        return count > 0;
    }

    async getRows(table, fields = "*", where = "", ...params) 
    {
        try 
        {
            const sql = where 
                ? `SELECT ${fields} FROM ${table} WHERE ${where};` 
                : `SELECT ${fields} FROM ${table};`;

            const rows = await this.all(sql, params.flat(Infinity));

            if(rows.length === 0) 
                return { success: false, reason: 'Registro não encontrado', [table]: [] };
            
            return {
                success: true,
                reason: 'NO_REASON',
                [table]: rows
            };
        } 
        
        catch (err) 
        {
            console.error(`[ ERRO DB ] Falha na consulta 'getRows' na tabela '${table}':`, err.error);
            
            return {
                success: false,
                reason: `Erro na consulta SQL: ${err.error}`,
                [table]: []
            };
        }
    }

    async getValue(table, field, where = "", ...params) 
    {
        try 
        {
            const sql = where 
                ? `SELECT ${field} FROM ${table} WHERE ${where} LIMIT 1;` 
                : `SELECT ${field} FROM ${table} LIMIT 1;`;

            const row = await this.get(sql, params.flat(Infinity));

            if(!row) 
                return { success: false, reason: 'Registro não encontrado', value: null };
            
            return {
                success: true,
                reason: 'NO_REASON',
                value: row[field] !== undefined ? row[field] : row
            };
        } 

        catch (err) 
        {
            console.error(`[ ERRO DB ] Falha em 'getValue' na tabela '${table}':`, err.error);
            return { success: false, reason: err.error ? err.error.message : (err.message || String(err)), value: null };
        }
    }

    async insert(table, data) 
    {
        try 
        {
            const keys = Object.keys(data);
            const values = Object.values(data);

            //Concatenação de "?, " para consulta sql segura
            const placeholders = keys.map(() => '?').join(', ');

            const sql = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders});`;
            const result = await this.run(sql, values);

            return { success: true, reason: 'NO_REASON', lastID: result.lastID };
        } 

        catch (err) 
        {
            console.error(`[ ERRO DB ] Erro ao inserir na tabela '${table}':`, err.error);
            return { success: false, reason: err.error ? err.error.message : (err.message || String(err)), lastID: -1 };
        }
    }

    async update(table, setClause, where = "", ...params) 
    {
        try 
        {
            if(!where) 
            {
                return {
                    success: false,
                    reason: `Por segurança, a tabela '${table}' não foi atualizada por falta de cláusula WHERE.`,
                    changes: 0
                };
            }

            const sql = `UPDATE ${table} SET ${setClause} WHERE ${where};`;
    
            const result = await this.run(sql, params.flat(Infinity));

            return { success: true, reason: 'NO_REASON', changes: result.changes };
        } 

        catch (err) 
        {
            console.error(`[ ERRO DB ] Erro ao atualizar dados na tabela '${table}':`, err.error);
            return { success: false, reason: err.error ? err.error.message : (err.message || String(err)), changes: 0 };
        }
    }

    async delete(table, where = "", ...params) 
    {
        try 
        {
            if(!where || where.trim().length === 0) 
            {
                return {
                    success: false,
                    reason: `Por segurança, a tabela '${table}' não foi alterada por falta de cláusula WHERE.`,
                    changes: 0
             }  ;
            }

            const sql = `DELETE FROM ${table} WHERE ${where};`;

            const result = await this.run(sql, params.flat(Infinity));

            return { success: true, reason: 'NO_REASON', changes: result.changes };

        } 
        
        catch (err) 
        {
            console.error(`[ ERRO DB ] Erro ao deletar dados na tabela '${table}':`, err.error);
            return { success: false, reason: err.error ? err.error.message : (err.message || String(err)), changes: 0 };
        }
    }   
}

export const beedb = new Database(database);
