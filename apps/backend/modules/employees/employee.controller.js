import { employeeService } from './employee.service.js';
import { isValidationError } from '../shared/errors.js';

function handleError(res, error) {
    if (isValidationError(error)) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }

    return res.status(500).json({
        success: false,
        error: 'Falha ao buscar colaboradores no banco de dados.'
    });
}

export async function getEmployees(req, res) {
    try {
        const name = typeof req.query.name === 'string' && req.query.name.trim().length > 0
            ? req.query.name.trim()
            : null;
        const hasUid = Object.prototype.hasOwnProperty.call(req.query, 'uid');
        const uid = req.query.uid;

        let payload;

        if (name && !hasUid) {
            payload = await employeeService.getEmployeeByName(name);
        } else if (!name && hasUid) {
            payload = [await employeeService.getEmployeeByUid(uid)].filter(Boolean);
        } else if (!name && !hasUid) {
            payload = await employeeService.getEmployees();
        } else {
            return res.status(400).json({
                success: false,
                error: 'Parâmetros de consulta inválidos.'
            });
        }

        return res.json({
            success: true,
            count: payload.length,
            data: payload
        });
    } catch (error) {
        return handleError(res, error);
    }
}
