import { DataTypes, Model } from "sequelize";

export default (sequelize) => {
	class Zone extends Model {
		static associate({ Site }) {
			this.belongsTo(Site, { foreignKey: "siteId", as: "site" });
		}
	}

	Zone.init(
		{
			siteId: {
				type: DataTypes.INTEGER,
				allowNull: false,
			},
			name: {
				type: DataTypes.STRING,
				allowNull: false,
				unique: true,
			},
		},
		{
			sequelize,
			modelName: "Zone",
		},
	);

	return Zone;
};
