const Helpers = {
    isObject,
    deepClone,
    normalizeString,
    nowIso,
    toIsoString,
    addDaysIso,
    padUid,
    stripUndefined,
    objectFromRow,
    rowFromObject,
    clamp,
    ensureArray
};

function isObject(value) {
    return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function deepClone(value) {
    return JSON.parse(JSON.stringify(value));
}

function normalizeString(value) {
    return String(value == null ? '' : value).trim();
}

function nowIso() {
    return new Date().toISOString();
}

function toIsoString(value) {
    if (!value) {
        return '';
    }

    const date = value instanceof Date ? value : new Date(value);
    return isNaN(date.getTime()) ? '' : date.toISOString();
}

function addDaysIso(value, days) {
    const date = value ? new Date(value) : new Date();
    if (isNaN(date.getTime())) {
        return '';
    }

    date.setDate(date.getDate() + Number(days || 0));
    return date.toISOString();
}

function padUid(uid) {
    const numeric = Number.parseInt(uid, 10);
    if (!Number.isFinite(numeric)) {
        return '0000';
    }

    return String(numeric).padStart(4, '0');
}

function stripUndefined(data) {
    const result = {};
    Object.keys(data || {}).forEach(key => {
        if (data[key] !== undefined) {
            result[key] = data[key];
        }
    });
    return result;
}

function objectFromRow(headers, row) {
    const result = {};

    headers.forEach((header, index) => {
        result[header] = row[index];
    });

    return result;
}

function rowFromObject(headers, object) {
    return headers.map(header => object[header] !== undefined ? object[header] : '');
}

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

function ensureArray(value) {
    if (Array.isArray(value)) {
        return value;
    }

    if (value == null) {
        return [];
    }

    return [value];
}
