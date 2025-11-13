import { DataTypes, Model } from "sequelize";

export default (sequelize) => {
	class Shelf extends Model {
		static associate({ Rack }) {
			this.belongsTo(Rack, { foreignKey: "rackId", as: "rack" });
		}
	}

	Shelf.init(
		{
			rackId: {
				type: DataTypes.INTEGER,
				allowNull: false,
			},
			name: {
				type: DataTypes.STRING,
				allowNull: false,
				unique: true,
			},
			description: {
				type: DataTypes.STRING,
				allowNull: false,
			},
			barcode: {
				type: DataTypes.STRING,
				allowNull: false,
				unique: true,
			},
			capacity: {
				type: DataTypes.DOUBLE,
				allowNull: false,
				defaultValue: 0,
			},
			loadedCapacity: {
				type: DataTypes.DOUBLE,
				allowNull: false,
				defaultValue: 0,
			},
			volume: {
				type: DataTypes.DOUBLE,
				allowNull: false,
				defaultValue: 0,
			},
			loadedVolume: {
				type: DataTypes.DOUBLE,
				allowNull: false,
				defaultValue: 0,
			},
		},
		{
			sequelize,
			modelName: "Shelf",
		},
	);

	return Shelf;
};
