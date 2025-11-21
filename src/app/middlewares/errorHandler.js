import env from "#app/configs/env.js";
import SequelizeErrors from "#app/helpers/SequelizeErrors.js";

export default (error, request, response, _next) => {
	const isProduction = env.NODE_ENV === "production";

	let status = error.status || 500;
	let message = error.message || "Internal Server Error";
	let errors = null;

	const formatted = SequelizeErrors(error);
	if (formatted) {
		status = formatted.status;
		message = formatted.message;
		errors = formatted.errors;
	}

	if (request.transaction && !request.transaction.finished) {
		request.transaction.rollback().catch(() => {});
	}

	return response.status(status).json({
		status: status,
		message,
		...(errors && !isProduction && { errors }),
		...(!isProduction && error.stack && { stack: error.stack }),
	});
};
