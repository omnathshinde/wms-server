import { DataTypes, Model } from "sequelize";

export default (sequelize) => {
	class FifoViolation extends Model {
		static associate({ Site, Inward, Picklist }) {
			this.belongsTo(Site, { foreignKey: "siteId", as: "site" });
			this.belongsTo(Inward, { foreignKey: "inwardId", as: "inward" });
			this.belongsTo(Picklist, { foreignKey: "picklistId", as: "picklist" });
		}
	}

	FifoViolation.init(
		{
			siteId: {
				type: DataTypes.INTEGER,
				allowNull: true,
			},
			barcode: {
				type: DataTypes.STRING,
				allowNull: false,
			},
			inwardId: {
				type: DataTypes.INTEGER,
				allowNull: false,
			},
			picklistId: {
				type: DataTypes.INTEGER,
				allowNull: false,
			},
			type: {
				type: DataTypes.ENUM("violation", "override"),
				defaultValue: "violation",
				comment: "violation = user blocked, override = admin override FIFO",
			},
			reason: {
				type: DataTypes.STRING,
				allowNull: false,
				defaultValue: "FIFO is violated: tried to pick newer material before older batch",
			},
			blockedByBarcode: {
				type: DataTypes.STRING,
				allowNull: true,
				comment: "Older barcode that caused FIFO violation",
			},
			blockedByDate: {
				type: DataTypes.DATE,
				allowNull: true,
				comment: "Date of the older barcode that caused the block",
			},
		},
		{
			sequelize,
			modelName: "FifoViolation",
		},
	);

	return FifoViolation;
};
