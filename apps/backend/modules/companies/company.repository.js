import { db } from '@beevolt/database';

const COMPANY_TABLE = 'companies';
const COMPANY_COLUMNS = [
    'uid',
    'name',
    'email',
    'phone',
    'website',
    'actfield',
    'insight',
    'service',
    'subscribers'
];

const COMPANY_WRITABLE_FIELDS = new Set([
    'name',
    'email',
    'phone',
    'website',
    'actfield',
    'insight',
    'service',
    'subscribers'
]);

function pickWritableFields(data = {}) {
    return Object.fromEntries(
        Object.entries(data)
            .filter(([key, value]) => COMPANY_WRITABLE_FIELDS.has(key) && value !== undefined)
    );
}

function selectColumns() {
    return COMPANY_COLUMNS.join(', ');
}

export const companyRepository = {
    async findAll() {
        return db.all(
            `SELECT ${selectColumns()} FROM ${COMPANY_TABLE} ORDER BY uid ASC`
        );
    },

    async findByUidRange(startUid, endUid) {
        if (endUid !== -1) {
            return db.all(
                `SELECT ${selectColumns()} FROM ${COMPANY_TABLE} WHERE uid BETWEEN ? AND ? ORDER BY uid ASC`,
                [startUid, endUid]
            );
        }

        return db.all(
            `SELECT ${selectColumns()} FROM ${COMPANY_TABLE} WHERE uid >= ? ORDER BY uid ASC`,
            [startUid]
        );
    },

    async findBySubscriber(subscriber) {
        return db.all(
            `SELECT ${selectColumns()} FROM ${COMPANY_TABLE} WHERE subscribers = ? ORDER BY uid ASC`,
            [subscriber]
        );
    },

    async findByUid(uid) {
        return db.get(
            `SELECT ${selectColumns()} FROM ${COMPANY_TABLE} WHERE uid = ? LIMIT 1`,
            [uid]
        );
    },

    async create(data) {
        const payload = pickWritableFields(data);
        return db.insert(COMPANY_TABLE, payload);
    },

    async update(uid, data) {
        const payload = pickWritableFields(data);
        return db.update(COMPANY_TABLE, payload, 'uid = ?', uid);
    }
};

export { COMPANY_COLUMNS, COMPANY_TABLE, COMPANY_WRITABLE_FIELDS, pickWritableFields };
