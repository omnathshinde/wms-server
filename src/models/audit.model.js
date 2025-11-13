import { DataTypes, Model } from "sequelize";

export default (sequelize) => {
	class Audit extends Model {
		static associate({ Site }) {
			this.belongsTo(Site, { foreignKey: "siteId", as: "site" });
		}
	}

	Audit.init(
		{
			siteId: {
				type: DataTypes.INTEGER,
				allowNull: false,
			},
			number: {
				type: DataTypes.STRING,
				allowNull: false,
				unique: true,
			},
			startBy: {
				type: DataTypes.STRING,
				allowNull: true,
			},
			startAt: {
				type: DataTypes.DATE,
				allowNull: true,
			},
			endAt: {
				type: DataTypes.DATE,
				allowNull: true,
			},
			endBy: {
				type: DataTypes.STRING,
				allowNull: true,
			},
			auditStatus: {
				type: DataTypes.ENUM("Pending", "In Progress", "Reconcile", "Completed"),
				allowNull: false,
				defaultValue: "Pending",
			},
		},
		{
			sequelize,
			modelName: "Audit",
		},
	);

	return Audit;
};
