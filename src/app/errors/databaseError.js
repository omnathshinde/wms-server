export default (error) => {
	console.log("❌ DATABASE CONNECTION FAILED");
	const { code, errno, sqlState, sqlMessage, sql } =
		error?.parent || error?.original || error;

	const dbCode = { code, errno, sqlState, sqlMessage, sql };

	let errorType;

	switch (error.name) {
		case "SequelizeAccessDeniedError":
			errorType = {
				title: "🔐 Database Authentication Failed",
				message: "Invalid database username or password",
			};
			break;

		case "SequelizeConnectionRefusedError":
			errorType = {
				title: "📡 Connection Refused",
				message: "Database server refused connection",
			};
			break;

		case "SequelizeHostNotFoundError":
			errorType = {
				title: "🌐 Host Not Found",
				message: "Database host not found",
			};
			break;

		case "SequelizeHostNotReachableError":
			errorType = {
				title: "📶 Host Unreachable",
				message: "Database host unreachable",
			};
			break;

		case "SequelizeInvalidConnectionError":
			errorType = {
				title: "⚠️ Invalid Connection",
				message: "Invalid database connection configuration",
			};
			break;

		case "SequelizeConnectionTimedOutError":
			errorType = {
				title: "⏳ Connection Timeout",
				message: "Database connection timeout",
			};
			break;

		default:
			errorType = {
				title: `📛 ${error.name}`,
				message: error.message,
			};
	}
	console.log({ ...errorType, code: dbCode });
};
