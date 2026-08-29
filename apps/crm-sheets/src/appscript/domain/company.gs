const CompanyDomain = {
    fields: CRM_getCompanyFieldMap(),
    fromRow,
    toRow,
    fromPayload,
    empty
};

function empty() {
    return {
        uid: '',
        name: '',
        email: '',
        phone: '',
        website: '',
        actfield: '',
        insight: '',
        service: '',
        subscribers: ''
    };
}

function fromPayload(payload) {
    const company = empty();
    return Object.assign(company, Formatting.buildCompanySummary(payload));
}

function fromRow(row) {
    if (!Array.isArray(row)) {
        return empty();
    }

    return {
        uid: row[0] || '',
        name: row[1] || '',
        email: row[2] || '',
        phone: row[3] || '',
        website: row[4] || '',
        actfield: row[5] || '',
        insight: row[6] || '',
        service: row[7] || '',
        subscribers: row[8] || ''
    };
}

function toRow(company) {
    const data = Object.assign(empty(), Formatting.buildCompanySummary(company));

    return [
        data.uid,
        data.name,
        data.email,
        data.phone,
        data.website,
        data.actfield,
        data.insight,
        data.service,
        data.subscribers
    ];
}
