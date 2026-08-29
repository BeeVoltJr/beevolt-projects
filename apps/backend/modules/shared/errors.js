export class ValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ValidationError';
        this.statusCode = 400;
    }
}

export function isValidationError(error) {
    return Boolean(error && (error.statusCode === 400 || error.name === 'ValidationError'));
}
