const EmployeeController = {
    list,
    get,
    create,
    update,
    remove,
    getFormEmployees
};

function list() {
    return EmployeeService.list();
}

function get(uid) {
    return EmployeeService.get(uid);
}

function create(data) {
    return EmployeeService.create(data);
}

function update(uid, data) {
    return EmployeeService.update(uid, data);
}

function remove(uid) {
    return EmployeeService.remove(uid);
}

function getFormEmployees() {
    return EmployeeService.getFormEmployees();
}
