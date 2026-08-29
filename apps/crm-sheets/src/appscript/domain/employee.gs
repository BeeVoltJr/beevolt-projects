const EmployeeDomain = {
    empty,
    fromRow,
    toRow,
    fromPayload
};

function emptyEmployee() {
    return {
        uid: '',
        name: '',
        email: '',
        active: true
    };
}

function empty() {
    return emptyEmployee();
}

function fromPayload(payload) {
    const employee = emptyEmployee();
    return Object.assign(employee, Validation.sanitizeEmployeePayload(payload));
}

function fromRow(row) {
    if (!Array.isArray(row)) {
        return emptyEmployee();
    }

    return {
        uid: row[0] || '',
        name: row[1] || '',
        email: row[2] || '',
        active: row[3] === true || row[3] === 'TRUE'
    };
}

function toRow(employee) {
    const data = Object.assign(emptyEmployee(), Validation.sanitizeEmployeePayload(employee));

    return [
        data.uid,
        data.name,
        data.email,
        data.active ? 'TRUE' : 'FALSE'
    ];
}
