import { DataTypes, Model } from "sequelize";

export default (sequelize) => {
	class Site extends Model {}

	Site.init(
		{
			name: {
				type: DataTypes.STRING,
				allowNull: false,
				unique: true,
			},
		},
		{
			sequelize,
			modelName: "Site",
		},
	);

	return Site;
};
