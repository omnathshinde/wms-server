import { DataTypes, Model } from "sequelize";

export default (sequelize) => {
	class Putaway extends Model {
		static associate({ Inward, Shelf }) {
			this.belongsTo(Inward, { foreignKey: "inwardId", as: "inward" });
			this.belongsTo(Shelf, { foreignKey: "currentShelfId", as: "currentLocation" });
			this.belongsTo(Shelf, { foreignKey: "previousShelfId", as: "previousLocation" });
		}
	}

	Putaway.init(
		{
			inwardId: {
				type: DataTypes.INTEGER,
				allowNull: false,
			},
			quantity: {
				type: DataTypes.INTEGER,
				allowNull: false,
				defaultValue: 1,
			},
			currentShelfId: {
				type: DataTypes.INTEGER,
				allowNull: false,
			},
			currentShelf: {
				type: DataTypes.STRING,
				allowNull: false,
			},
			previousShelfId: {
				type: DataTypes.INTEGER,
				allowNull: true,
			},
			previousShelf: {
				type: DataTypes.STRING,
				allowNull: true,
			},
		},
		{
			sequelize,
			modelName: "Putaway",
		},
	);

	return Putaway;
};
