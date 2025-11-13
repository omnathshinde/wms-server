import { DataTypes, Model } from "sequelize";

export default (sequelize) => {
	class AuditItemBarcode extends Model {
		static associate({ AuditItem, Inward }) {
			this.belongsTo(AuditItem, { foreignKey: "auditItemId", as: "auditItem" });
			this.belongsTo(Inward, { foreignKey: "inwardId", as: "inward" });
		}
	}

	AuditItemBarcode.init(
		{
			auditItemId: {
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
			materialName: {
				type: DataTypes.STRING,
				allowNull: false,
			},
			materialDescription: {
				type: DataTypes.STRING,
				allowNull: false,
			},
			shelf: {
				type: DataTypes.STRING,
				allowNull: false,
			},
			remark: {
				type: DataTypes.STRING,
				allowNull: true,
			},
			barcodeStatus: {
				type: DataTypes.ENUM("Found", "Not Found", "Scrapped", "Manually Approved"),
				allowNull: false,
				defaultValue: "Not Found",
			},
		},
		{
			sequelize,
			modelName: "AuditItemBarcode",
			indexes: [
				{
					unique: true,
					fields: ["auditItemId", "inwardId"],
					name: "unique_inward_per_auditItem",
				},
			],
		},
	);

	return AuditItemBarcode;
};
