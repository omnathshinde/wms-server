import { DataTypes, Model } from "sequelize";

export default (sequelize) => {
	class Rack extends Model {
		static associate({ Zone }) {
			this.belongsTo(Zone, { foreignKey: "zoneId", as: "zone" });
		}
	}

	Rack.init(
		{
			zoneId: {
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
			modelName: "Rack",
		},
	);

	return Rack;
};
