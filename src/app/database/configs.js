export default {
	database: process.env.DB_NAME,
	username: process.env.DB_USER,
	password: process.env.DB_PASS,

	host: process.env.DB_HOST,
	dialect: process.env.DB_DIALECT || "mysql",
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
