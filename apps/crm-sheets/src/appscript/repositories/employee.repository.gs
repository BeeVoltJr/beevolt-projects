const EmployeeRepository = {
    getSheet,
    ensureSheet,
    findAll,
    findById,
    create,
    update,
    delete: remove,
    seedFromProperties
};

function getEmployeeSheet() {
    return SheetRepository.getSheet(CRM.SHEETS.EMPLOYEE, {
        createIfMissing: false,
        headers: CRM.EMPLOYEE_HEADERS
    });
}

function ensureSheet() {
    const sheet = SheetRepository.getSheet(CRM.SHEETS.EMPLOYEE, {
        createIfMissing: true,
        headers: CRM.EMPLOYEE_HEADERS
    });

    SheetRepository.ensureHeaders(sheet, CRM.EMPLOYEE_HEADERS);
    return sheet;
}

function seedFromProperties() {
    const raw = PropertiesService.getScriptProperties().getProperty(CRM.PROPS.EMPLOYEES);

    if (!raw) {
        return [];
    }

    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed.map(EmployeeDomain.fromPayload) : [];
    } catch (error) {
        return [];
    }
}

function findAll() {
    const sheet = getEmployeeSheet();

    if (!sheet) {
        return seedFromProperties();
    }

    return SheetRepository.getObjects(sheet).map(EmployeeDomain.fromRow);
}

function findById(uid) {
    const rows = findAll();
    return rows.find(employee => String(employee.uid) === String(uid)) || null;
}

function create(employee) {
    const sheet = ensureSheet();
    const payload = EmployeeDomain.fromPayload(employee);
    payload.uid = payload.uid || findAll().reduce((max, current) => {
        const numeric = Number.parseInt(current.uid, 10);
        return Number.isFinite(numeric) ? Math.max(max, numeric) : max;
    }, 0) + 1;

    SheetRepository.append(sheet, EmployeeDomain.toRow(payload));
    return payload;
}

function update(uid, employee) {
    const sheet = ensureSheet();
    const match = SheetRepository.findRow(sheet, row => String(row.UID) === String(uid));

    if (!match) {
        throw new Error('Colaborador não encontrado.');
    }

    const current = EmployeeDomain.fromRow(Helpers.rowFromObject(CRM.EMPLOYEE_HEADERS, match.object));
    const patch = Helpers.stripUndefined(employee || {});
    const merged = Object.assign({}, current);

    Object.keys(patch).forEach(key => {
        if (patch[key] !== undefined && patch[key] !== '') {
            merged[key] = patch[key];
        }
    });

    merged.uid = current.uid;
    SheetRepository.updateRow(sheet, match.rowIndex, EmployeeDomain.toRow(merged));

    return merged;
}

function remove(uid) {
    const sheet = ensureSheet();
    const match = SheetRepository.findRow(sheet, row => String(row.UID) === String(uid));

    if (!match) {
        return false;
    }

    SheetRepository.deleteRow(sheet, match.rowIndex);
    return true;
}
