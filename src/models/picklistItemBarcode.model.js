import { DataTypes, Model } from "sequelize";

export default (sequelize) => {
	class PicklistItemBarcode extends Model {
		static associate({ Inward, PicklistItem }) {
			this.belongsTo(PicklistItem, { foreignKey: "picklistItemId", as: "picklistItem" });
			this.belongsTo(Inward, { foreignKey: "inwardId", as: "inward" });
		}
	}

	PicklistItemBarcode.init(
		{
			picklistItemId: {
				type: DataTypes.INTEGER,
				allowNull: false,
			},
			inwardId: {
				type: DataTypes.INTEGER,
				allowNull: false,
			},
			barcode: {
				type: DataTypes.STRING,
				allowNull: false,
			},
			quantity: {
				type: DataTypes.INTEGER,
				allowNull: false,
				defaultValue: 1,
			},
			shelf: {
				type: DataTypes.STRING,
				allowNull: false,
			},
		},
		{
			sequelize,
			modelName: "PicklistItemBarcode",
			indexes: [
				{
					unique: true,
					fields: ["picklistItemId", "inwardId"],
					name: "unique_inward_per_picklistItem",
				},
			],
		},
	);

	return PicklistItemBarcode;
};
