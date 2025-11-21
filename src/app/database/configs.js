import env from "#app/configs/env.js";

const { DB_NAME, DB_USER, DB_PASS, DB_HOST, DB_DIALECT } = env;

export default {
	database: DB_NAME,
	username: DB_USER,
	password: DB_PASS,

	host: DB_HOST,
	dialect: DB_DIALECT,
	logging: true,
	benchmark: true,
	pool: {
		min: 0,
		max: 5,
		idle: 10000,
		acquire: 30000,
	},
	define: {
		paranoid: true,
		timestamps: true,
		freezeTableName: true,
		defaultScope: {
			attributes: {
				include: ["createdBy", "updatedBy"],
			},
		},
	},
	retry: { max: 3 },
};
