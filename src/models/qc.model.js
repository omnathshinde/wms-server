import { DataTypes, Model } from "sequelize";

export default (sequelize) => {
	class QC extends Model {
		static associate({ Inward }) {
			this.belongsTo(Inward, { foreignKey: "inwardId", as: "inward" });
		}
	}

	QC.init(
		{
			inwardId: {
				type: DataTypes.INTEGER,
				allowNull: false,
			},
			remark: {
				type: DataTypes.STRING,
				allowNull: false,
			},
			qcStatus: {
				type: DataTypes.ENUM("Pending", "Approved", "Rejected"),
				allowNull: false,
				defaultValue: "Pending",
			},
		},
		{
			sequelize,
			modelName: "QC",
		},
	);

	return QC;
};
