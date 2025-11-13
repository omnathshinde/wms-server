import { DataTypes, Model } from "sequelize";

export default (sequelize) => {
	class Role extends Model {}

	Role.init(
		{
			name: {
				type: DataTypes.STRING,
				allowNull: false,
				unique: true,
			},
		},
		{
			sequelize,
			modelName: "Role",
		},
	);

	return Role;
};
