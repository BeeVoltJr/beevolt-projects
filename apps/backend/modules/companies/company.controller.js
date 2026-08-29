import { companyService } from './company.service.js';
import { isValidationError } from '../shared/errors.js';

function handleError(res, error, fallbackMessage) {
    if (isValidationError(error)) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }

    return res.status(500).json({
        success: false,
        message: fallbackMessage
    });
}

export async function getCompanies(req, res) {
    try {
        const subscriber = typeof req.query.sub === 'string' && req.query.sub.trim().length > 0
            ? req.query.sub.trim()
            : null;

        const hasStart = Object.prototype.hasOwnProperty.call(req.query, 'start');
        const hasEnd = Object.prototype.hasOwnProperty.call(req.query, 'end');

        if (subscriber) {
            const data = await companyService.getCompanies({ subscriber });

            return res.json({
                success: true,
                count: data.length,
                data
            });
        }

        if (!hasStart || !hasEnd) {
            return res.status(400).json({
                success: false,
                error: 'Parâmetros de consulta inválidos. Forneça um intervalo ou um colaborador'
            });
        }

        const parsedStart = Number.parseInt(req.query.start, 10);
        const parsedEnd = Number.parseInt(req.query.end, 10);

        if (!Number.isInteger(parsedStart) || !Number.isInteger(parsedEnd)) {
            return res.status(400).json({
                success: false,
                error: 'Parâmetros de consulta inválidos. Forneça um intervalo ou um colaborador'
            });
        }

        const data = await companyService.getCompanies({
            start: parsedStart,
            end: parsedEnd
        });

        return res.json({
            success: true,
            count: data.length,
            data
        });
    } catch (error) {
        return handleError(res, error, 'Falha ao buscar empresas no banco de dados.');
    }
}

export async function createCompany(req, res) {
    try {
        const result = await companyService.createCompany(req.body);

        if (!result.success) {
            return res.status(500).json({
                success: false,
                message: 'Houve um erro no servidor interno ao cadastrar a empresa.',
                error: result.reason
            });
        }

        return res.status(201).json({
            success: true,
            message: 'Empresa cadastrada com sucesso!',
            id: result.lastID
        });
    } catch (error) {
        return handleError(res, error, 'Houve um erro no servidor interno. Avise o setor de P&D imediatamente!');
    }
}

export async function updateCompany(req, res) {
    try {
        const uid = req.params.uid || req.query.edit || req.query.uid;
        const result = await companyService.updateCompany(uid, req.body);

        if (!result.success) {
            return res.status(500).json({
                success: false,
                message: 'Houve um erro ao atualizar os dados no servidor.',
                error: result.reason
            });
        }

        return res.json({
            success: true,
            message: 'Dados atualizados com sucesso!',
            changes: result.changes
        });
    } catch (error) {
        return handleError(res, error, 'Houve um erro no servidor interno. Avise o setor de P&D imediatamente!');
    }
}

export async function getCompanyByUid(req, res) {
    try {
        const company = await companyService.getCompanyByUid(req.params.uid);

        if (!company) {
            return res.status(404).json({
                success: false,
                message: 'Empresa não encontrada.'
            });
        }

        return res.json({
            success: true,
            data: company
        });
    } catch (error) {
        return handleError(res, error, 'Falha ao buscar empresa no banco de dados.');
    }
}
