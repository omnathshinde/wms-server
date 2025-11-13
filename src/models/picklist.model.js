import { DataTypes, Model } from "sequelize";

export default (sequelize) => {
	class Picklist extends Model {
		static associate({ Site, User, Customer }) {
			this.belongsTo(Site, { foreignKey: "siteId", as: "site" });
			this.belongsTo(User, { foreignKey: "userId", as: "user" });
			this.belongsTo(Customer, { foreignKey: "customerId", as: "customer" });
		}
	}

	Picklist.init(
		{
			siteId: {
				type: DataTypes.INTEGER,
				allowNull: false,
			},
			userId: {
				type: DataTypes.INTEGER,
				allowNull: false,
			},
			customerId: {
				type: DataTypes.INTEGER,
				allowNull: false,
			},
			name: {
				type: DataTypes.STRING,
				allowNull: false,
				unique: true,
			},
			picklistStatus: {
				type: DataTypes.ENUM("Pending", "In Progress", "Completed"),
				allowNull: false,
				defaultValue: "Pending",
			},
			startedBy: {
				type: DataTypes.STRING,
				allowNull: true,
			},
			startedAt: {
				type: DataTypes.DATE,
				allowNull: true,
			},
			compeletedBy: {
				type: DataTypes.STRING,
				allowNull: true,
			},
			compeletedAt: {
				type: DataTypes.STRING,
				allowNull: true,
			},
			isIssued: {
				type: DataTypes.BOOLEAN,
				allowNull: false,
				defaultValue: false,
			},
			issueDate: {
				type: DataTypes.DATE,
				allowNull: true,
			},
			issueBy: {
				type: DataTypes.STRING,
				allowNull: true,
			},
			isPartial: {
				type: DataTypes.BOOLEAN,
				allowNull: false,
				defaultValue: false,
			},
			invoice: {
				type: DataTypes.STRING,
				allowNull: false,
				defaultValue: "N/A",
			},
			vehicleNo: {
				type: DataTypes.STRING,
				allowNull: true,
			},
		},
		{
			sequelize,
			modelName: "Picklist",
			indexes: [{ fields: ["name"] }],
		},
	);
	return Picklist;
};
