export class HttpError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function sendSuccess(response, data, status = 200) {
  return response.status(status).json({ success: true, data, error: null });
}

export function errorHandler(error, request, response, _next) {
  if (response.headersSent) return;
  const isValidationError = error.name === 'ZodError';
  const status = isValidationError ? 400 : Number.isInteger(error.status) ? error.status : 500;
  if (status >= 500) console.error(error);
  response.status(status).json({
    success: false,
    data: null,
    error: {
      code: error.code || (isValidationError ? 'VALIDATION_ERROR' : 'INTERNAL_ERROR'),
      message: status >= 500 ? 'The server could not complete the request.' : isValidationError ? 'The request did not pass validation.' : error.message,
      ...(isValidationError ? {
        details: error.issues.map(issue => ({ field: issue.path.join('.'), message: issue.message })),
      } : {}),
    },
  });
}
