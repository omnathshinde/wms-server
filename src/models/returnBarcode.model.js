import { DataTypes, Model } from "sequelize";

export default (sequelize) => {
	class ReturnBarcode extends Model {
		static associate({ Inward, Picklist, Site }) {
			this.belongsTo(Inward, { foreignKey: "inwardId", as: "inward" });
			this.belongsTo(Picklist, { foreignKey: "picklistId", as: "picklist" });
			this.belongsTo(Site, { foreignKey: "siteId", as: "site" });
		}
	}

	ReturnBarcode.init(
		{
			siteId: {
				type: DataTypes.INTEGER,
				allowNull: false,
			},
			remark: {
				type: DataTypes.STRING,
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
			materialName: {
				type: DataTypes.STRING,
				allowNull: false,
			},
			materialDescription: {
				type: DataTypes.STRING,
				allowNull: false,
			},
			inwardDate: {
				type: DataTypes.DATE,
				allowNull: false,
			},
			dispatchAt: {
				type: DataTypes.STRING,
				allowNull: false,
			},
			dispatchBy: {
				type: DataTypes.STRING,
				allowNull: false,
			},
			picklistId: {
				type: DataTypes.INTEGER,
				allowNull: false,
			},
			picklistName: {
				type: DataTypes.STRING,
				allowNull: false,
			},
			pickedBy: {
				type: DataTypes.STRING,
				allowNull: false,
			},
			lastShelfId: {
				type: DataTypes.INTEGER,
				allowNull: false,
			},
			lastShelf: {
				type: DataTypes.STRING,
				allowNull: false,
			},
		},
		{
			sequelize,
			modelName: "ReturnBarcode",
		},
	);

	return ReturnBarcode;
};
