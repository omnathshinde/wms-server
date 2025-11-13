import { DataTypes, Model } from "sequelize";

export default (sequelize) => {
	class Access extends Model {}

	Access.init(
		{
			name: {
				type: DataTypes.STRING,
				allowNull: false,
				unique: true,
			},
			description: {
				type: DataTypes.STRING,
				allowNull: false,
			},
		},
		{
			sequelize,
			modelName: "Access",
		},
	);

	return Access;
};
