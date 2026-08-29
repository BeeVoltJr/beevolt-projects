import fs from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const projectRoot = path.resolve(__dirname, '../../..');
export const databasePath = path.resolve(projectRoot, 'database', 'beedb.db');

const SQL_IDENTIFIER = /^[A-Za-z_][A-Za-z0-9_]*$/;

if (!fs.existsSync(path.dirname(databasePath))) {
    fs.mkdirSync(path.dirname(databasePath), { recursive: true });
}

const PYTHON_SQLITE_BRIDGE = String.raw`
import json
import sqlite3
import sys

mode = sys.argv[1]
db_path = sys.argv[2]

payload = json.loads(sys.stdin.read() or '{}')
sql = payload.get('sql', '')
params = payload.get('params', [])

conn = sqlite3.connect(db_path)
conn.row_factory = sqlite3.Row
cur = conn.cursor()

try:
    if mode == 'get':
        cur.execute(sql, params)
        row = cur.fetchone()
        print(json.dumps({'row': dict(row) if row is not None else None}))
    elif mode == 'all':
        cur.execute(sql, params)
        rows = cur.fetchall()
        print(json.dumps({'rows': [dict(row) for row in rows]}))
    elif mode == 'run':
        cur.execute(sql, params)
        conn.commit()
        print(json.dumps({'changes': cur.rowcount, 'lastID': cur.lastrowid}))
    elif mode == 'exec':
        cur.executescript(sql)
        conn.commit()
        print(json.dumps({'ok': True}))
    else:
        raise ValueError(f'Unsupported mode: {mode}')
finally:
    conn.close()
`;

function assertIdentifier(value, label = 'identificador') {
    if (typeof value !== 'string' || !SQL_IDENTIFIER.test(value)) {
        throw new Error(`Identificador SQL inválido para ${label}: ${String(value)}`);
    }

    return value;
}

function assertIdentifierList(values, label = 'campos') {
    const list = Array.isArray(values) ? values : [values];

    return list.map(value => assertIdentifier(value, label));
}

function normalizeColumns(columns) {
    if (columns === '*' || columns === undefined) {
        return '*';
    }

    return assertIdentifierList(columns, 'coluna').join(', ');
}

function flattenParams(params = []) {
    return params.flat(Infinity).filter(value => value !== undefined);
}

function runBridge(mode, sql, params = []) {
    return new Promise((resolve, reject) => {
        const child = execFile(
            'python3',
            ['-c', PYTHON_SQLITE_BRIDGE, mode, databasePath],
            {
                maxBuffer: 10 * 1024 * 1024,
                env: process.env
            },
            (error, stdout, stderr) => {
                if (error) {
                    return reject({
                        error,
                        query: sql,
                        params,
                        stderr: stderr?.toString() || ''
                    });
                }

                try {
                    const parsed = JSON.parse(stdout || '{}');
                    resolve(parsed);
                } catch (parseError) {
                    reject({
                        error: parseError,
                        query: sql,
                        params,
                        stdout: stdout?.toString() || '',
                        stderr: stderr?.toString() || ''
                    });
                }
            }
        );

        child.stdin.end(JSON.stringify({
            sql,
            params: flattenParams(params)
        }));
    });
}

export class Database {
    async get(sql, params = []) {
        const result = await runBridge('get', sql, params);
        return result.row || null;
    }

    async all(sql, params = []) {
        const result = await runBridge('all', sql, params);
        return result.rows || [];
    }

    async run(sql, params = []) {
        const result = await runBridge('run', sql, params);
        return {
            success: true,
            changes: result.changes ?? 0,
            lastID: result.lastID ?? 0
        };
    }

    async createTable(table, definition) {
        const tableName = assertIdentifier(table, 'tabela');
        await this.run(`CREATE TABLE IF NOT EXISTS ${tableName} (${definition})`);
        return true;
    }

    async count(table, where = '', ...params) {
        const tableName = assertIdentifier(table, 'tabela');
        const sql = where
            ? `SELECT COUNT(*) AS total FROM ${tableName} WHERE ${where}`
            : `SELECT COUNT(*) AS total FROM ${tableName}`;

        const row = await this.get(sql, params);
        return row ? row.total : 0;
    }

    async getCount(table, where = '', ...params) {
        return this.count(table, where, ...params);
    }

    async exists(table, where, ...params) {
        return (await this.count(table, where, ...params)) > 0;
    }

    async select(table, columns = '*', where = '', ...params) {
        const tableName = assertIdentifier(table, 'tabela');
        const columnList = normalizeColumns(columns);

        const sql = where
            ? `SELECT ${columnList} FROM ${tableName} WHERE ${where}`
            : `SELECT ${columnList} FROM ${tableName}`;

        return await this.all(sql, params);
    }

    async getRows(table, fields = '*', where = '', ...params) {
        try {
            const rows = await this.select(table, fields, where, ...params);

            if (rows.length === 0) {
                return {
                    success: false,
                    reason: 'Registro não encontrado',
                    [table]: []
                };
            }

            return {
                success: true,
                reason: 'NO_REASON',
                [table]: rows
            };
        } catch (err) {
            console.error(`[ ERRO DB ] Falha na consulta 'getRows' na tabela '${table}':`, err.error || err);

            return {
                success: false,
                reason: `Erro na consulta SQL: ${err.error?.message || err.message || String(err)}`,
                [table]: []
            };
        }
    }

    async getValue(table, field, where = '', ...params) {
        try {
            const rows = await this.select(table, [field], where, ...params);

            if (rows.length === 0) {
                return { success: false, reason: 'Registro não encontrado', value: null };
            }

            const row = rows[0];

            return {
                success: true,
                reason: 'NO_REASON',
                value: row[field] !== undefined ? row[field] : row
            };
        } catch (err) {
            console.error(`[ ERRO DB ] Falha em 'getValue' na tabela '${table}':`, err.error || err);
            return {
                success: false,
                reason: err.error?.message || err.message || String(err),
                value: null
            };
        }
    }

    async insert(table, data) {
        const tableName = assertIdentifier(table, 'tabela');
        const keys = Object.keys(data || {});

        if (keys.length === 0) {
            throw new Error('Nenhum campo informado para inserção.');
        }

        const validatedKeys = assertIdentifierList(keys, 'campo');
        const values = validatedKeys.map(key => data[key]);
        const placeholders = validatedKeys.map(() => '?').join(', ');

        const sql = `INSERT INTO ${tableName} (${validatedKeys.join(', ')}) VALUES (${placeholders})`;
        const result = await this.run(sql, values);

        return {
            success: true,
            reason: 'NO_REASON',
            lastID: result.lastID
        };
    }

    async update(table, data, where = '', ...params) {
        const tableName = assertIdentifier(table, 'tabela');

        if (!where || String(where).trim().length === 0) {
            return {
                success: false,
                reason: `Por segurança, a tabela '${tableName}' não foi atualizada por falta de cláusula WHERE.`,
                changes: 0
            };
        }

        const keys = Object.keys(data || {});
        if (keys.length === 0) {
            return {
                success: false,
                reason: 'Nenhum campo informado para atualização.',
                changes: 0
            };
        }

        const validatedKeys = assertIdentifierList(keys, 'campo');
        const setClause = validatedKeys.map(key => `${key} = ?`).join(', ');
        const values = validatedKeys.map(key => data[key]);

        const sql = `UPDATE ${tableName} SET ${setClause} WHERE ${where}`;
        const result = await this.run(sql, [...values, ...params]);

        return {
            success: true,
            reason: 'NO_REASON',
            changes: result.changes
        };
    }

    async delete(table, where = '', ...params) {
        const tableName = assertIdentifier(table, 'tabela');

        if (!where || String(where).trim().length === 0) {
            return {
                success: false,
                reason: `Por segurança, a tabela '${tableName}' não foi alterada por falta de cláusula WHERE.`,
                changes: 0
            };
        }

        const sql = `DELETE FROM ${tableName} WHERE ${where}`;
        const result = await this.run(sql, params);

        return {
            success: true,
            reason: 'NO_REASON',
            changes: result.changes
        };
    }
}

export const db = new Database();
export const beedb = db;

export { assertIdentifier };
