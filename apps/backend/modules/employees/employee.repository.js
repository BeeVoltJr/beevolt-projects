import { db } from '@beevolt/database';

const EMPLOYEE_TABLE = 'employees';
const EMPLOYEE_COLUMNS = [
    'uid',
    'name',
    'discord_uid'
];

const EMPLOYEE_WRITABLE_FIELDS = new Set([
    'name',
    'discord_uid'
]);

function pickWritableFields(data = {}) {
    return Object.fromEntries(
        Object.entries(data)
            .filter(([key, value]) => EMPLOYEE_WRITABLE_FIELDS.has(key) && value !== undefined)
    );
}

function selectColumns() {
    return EMPLOYEE_COLUMNS.join(', ');
}

export const employeeRepository = {
    async findAll() {
        return db.all(
            `SELECT ${selectColumns()} FROM ${EMPLOYEE_TABLE} ORDER BY name ASC`
        );
    },

    async findByName(name) {
        return db.all(
            `SELECT ${selectColumns()} FROM ${EMPLOYEE_TABLE} WHERE name = ? ORDER BY name ASC`,
            [name]
        );
    },

    async findByUid(uid) {
        return db.get(
            `SELECT ${selectColumns()} FROM ${EMPLOYEE_TABLE} WHERE uid = ? LIMIT 1`,
            [uid]
        );
    },

    async findByDiscordUid(discordUid) {
        return db.get(
            `SELECT ${selectColumns()} FROM ${EMPLOYEE_TABLE} WHERE discord_uid = ? LIMIT 1`,
            [discordUid]
        );
    },

    async create(data) {
        const payload = pickWritableFields(data);
        return db.insert(EMPLOYEE_TABLE, payload);
    },

    async update(uid, data) {
        const payload = pickWritableFields(data);
        return db.update(EMPLOYEE_TABLE, payload, 'uid = ?', uid);
    }
};

export { EMPLOYEE_COLUMNS, EMPLOYEE_TABLE, EMPLOYEE_WRITABLE_FIELDS, pickWritableFields };
