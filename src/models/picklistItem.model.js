import { DataTypes, Model } from "sequelize";

export default (sequelize) => {
	class PicklistItem extends Model {
		static associate({ Material, Picklist }) {
			this.belongsTo(Material, { foreignKey: "materialId", as: "material" });
			this.belongsTo(Picklist, { foreignKey: "picklistId", as: "picklist" });
		}
	}

	PicklistItem.init(
		{
			picklistId: {
				type: DataTypes.INTEGER,
				allowNull: false,
			},
			materialId: {
				type: DataTypes.INTEGER,
				allowNull: false,
			},
			materialName: {
				type: DataTypes.STRING,
				allowNull: false,
			},
			materialDescription: {
				type: DataTypes.STRING,
				allowNull: false,
			},
			materialQuantity: {
				type: DataTypes.INTEGER,
				allowNull: false,
			},
			pickedQuantity: {
				type: DataTypes.INTEGER,
				allowNull: false,
				defaultValue: 0,
			},
		},
		{
			sequelize,
			modelName: "PicklistItem",
			indexes: [
				{
					unique: true,
					fields: ["picklistId", "materialId"],
					name: "unique_material_per_picklist",
				},
			],
		},
	);

	return PicklistItem;
};
