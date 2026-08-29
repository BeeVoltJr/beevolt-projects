const EmployeeService = {
    list,
    get,
    create,
    update,
    remove,
    getFormEmployees
};

function list() {
    return EmployeeRepository.findAll();
}

function get(uid) {
    return EmployeeRepository.findById(uid);
}

function create(data) {
    return EmployeeRepository.create(data);
}

function update(uid, data) {
    return EmployeeRepository.update(uid, data);
}

function remove(uid) {
    return EmployeeRepository.delete(uid);
}

function getFormEmployees() {
    if (Configuration.isMain()) {
        return EmployeeRepository.findAll();
    }

    return [];
}
