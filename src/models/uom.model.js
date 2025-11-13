import { DataTypes, Model } from "sequelize";

export default (sequelize) => {
	class Uom extends Model {}

	Uom.init(
		{
			name: {
				type: DataTypes.STRING,
				allowNull: false,
				unique: true,
			},
		},
		{
			sequelize,
			modelName: "Uom",
		},
	);

	return Uom;
};
