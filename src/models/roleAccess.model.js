import { DataTypes, Model } from "sequelize";

export default (sequelize) => {
	class RoleAccess extends Model {
		static associate({ Role, Access }) {
			this.belongsTo(Role, { foreignKey: "roleId", as: "role" });
			this.belongsTo(Access, { foreignKey: "accessId", as: "access" });
		}
	}

	RoleAccess.init(
		{
			roleId: {
				type: DataTypes.INTEGER,
				allowNull: false,
			},
			accessId: {
				type: DataTypes.INTEGER,
				allowNull: false,
			},
			status: {
				type: DataTypes.BOOLEAN,
				allowNull: false,
				defaultValue: false,
			},
		},
		{
			sequelize,
			modelName: "RoleAccess",
			indexes: [
				{
					unique: true,
					fields: ["roleId", "accessId"],
				},
			],
		},
	);

	return RoleAccess;
};
