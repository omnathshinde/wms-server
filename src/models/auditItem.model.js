import { DataTypes, Model } from "sequelize";

export default (sequelize) => {
	class AuditItem extends Model {
		static associate({ Audit, Material }) {
			this.belongsTo(Audit, { foreignKey: "auditId", as: "audit" });
			this.belongsTo(Material, { foreignKey: "materialId", as: "material" });
		}
	}

	AuditItem.init(
		{
			auditId: {
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
			availableQuantity: {
				type: DataTypes.INTEGER,
				allowNull: false,
			},
			foundQuantity: {
				type: DataTypes.INTEGER,
				allowNull: false,
				defaultValue: 0,
			},
			notFoundQuantity: {
				type: DataTypes.INTEGER,
				allowNull: false,
			},
			scrappedQuantity: {
				type: DataTypes.INTEGER,
				allowNull: false,
				defaultValue: 0,
			},
			manuallyApprovedQuantity: {
				type: DataTypes.INTEGER,
				allowNull: false,
				defaultValue: 0,
			},
		},
		{
			sequelize,
			modelName: "AuditItem",
			indexes: [
				{
					unique: true,
					fields: ["auditId", "materialId"],
					name: "unique_material_per_audit",
				},
			],
		},
	);

	return AuditItem;
};
