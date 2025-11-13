import argon2 from "argon2";
import { DataTypes, Model } from "sequelize";

export default (sequelize) => {
	class User extends Model {
		static associate({ Site, Role }) {
			this.belongsTo(Site, { foreignKey: "siteId", as: "site" });
			this.belongsTo(Role, { foreignKey: "roleId", as: "role" });
		}
	}

	User.init(
		{
			siteId: {
				type: DataTypes.INTEGER,
				allowNull: true,
			},
			roleId: {
				type: DataTypes.INTEGER,
				allowNull: false,
			},
			username: {
				type: DataTypes.STRING,
				allowNull: false,
				unique: true,
			},
			password: {
				type: DataTypes.STRING,
				allowNull: false,
			},
			employeeId: {
				type: DataTypes.STRING,
				allowNull: true,
				unique: true,
			},
			name: {
				type: DataTypes.STRING,
				allowNull: false,
			},
		},
		{
			sequelize,
			modelName: "User",
			indexes: [{ fields: ["username"] }, { fields: ["createdBy"] }],
			hooks: {
				beforeCreate: async (user) => {
					user.password = await argon2.hash(user.password);
				},
				beforeBulkCreate: async (instances) => {
					await Promise.all(
						instances.map(async (user) => {
							if (user.password) {
								user.password = await argon2.hash(user.password);
							}
						}),
					);
				},
				beforeUpdate: async (user) => {
					if (user.changed("password")) {
						user.password = await argon2.hash(user.password);
					}
				},
				beforeBulkUpdate: async (options) => {
					if (options.attributes.password) {
						options.attributes.password = await argon2.hash(options.attributes.password);
					}
				},
			},
		},
	);

	return User;
};
