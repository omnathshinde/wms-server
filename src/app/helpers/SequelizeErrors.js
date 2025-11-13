const sequelizeErrors = {
	ValidationError: {
		status: 400,
		message: "Some fields are invalid. Please review and try again.",
		defaultField: "Invalid input for this field.",
	},

	UniqueConstraintError: {
		status: 409,
		message: "This value is already in use. Try something different.",
		defaultField: "This value is already taken.",
	},

	ForeignKeyConstraintError: {
		status: 400,
		message: "This record is linked to another resource and cannot be deleted.",
		defaultField: "This item is still in use elsewhere.",
	},

	DatabaseError: {
		status: 500,
		message:
			"Something went wrong while processing your request. Please try again later.",
		defaultField: "A technical error occurred.",
	},

	OptimisticLockError: {
		status: 409,
		message:
			"The data has changed since you last viewed it. Please refresh and try again.",
		defaultField: "Concurrent update conflict.",
	},
};

export default (error) => {
	switch (error.name) {
		case "SequelizeValidationError":
			return {
				status: sequelizeErrors.ValidationError.status,
				message: sequelizeErrors.ValidationError.message || "Validation error",
				errors: error.errors.map((e) => ({
					field: e.path,
					message: e.message || sequelizeErrors.ValidationError.defaultField,
				})),
			};

		case "SequelizeUniqueConstraintError":
			return {
				status: sequelizeErrors.UniqueConstraintError.status,
				message:
					sequelizeErrors.UniqueConstraintError.message || "Unique constraint error",
				errors: error.errors.map((e) => ({
					field: e.path,
					message: e.message || sequelizeErrors.UniqueConstraintError.defaultField,
				})),
			};

		case "SequelizeForeignKeyConstraintError":
			return {
				status: sequelizeErrors.ForeignKeyConstraintError.status,
				message:
					sequelizeErrors.ForeignKeyConstraintError.message ||
					"Invalid foreign key reference",
				errors: [{ message: sequelizeErrors.ForeignKeyConstraintError.defaultField }],
			};

		case "SequelizeDatabaseError":
			return {
				status: sequelizeErrors.DatabaseError.status,
				message: sequelizeErrors.DatabaseError.message || "Database error",
				errors: [{ message: sequelizeErrors.DatabaseError.defaultField }],
			};

		case "SequelizeOptimisticLockError":
			return {
				status: sequelizeErrors.OptimisticLockError.status,
				message: sequelizeErrors.OptimisticLockError.message || "Optimistic lock error",
				errors: [{ message: sequelizeErrors.OptimisticLockError.defaultField }],
			};

		default:
			return null;
	}
};
