import { DataTypes, Model } from "sequelize";

export default (sequelize) => {
	class Customer extends Model {
		static associate({ Site }) {
			this.belongsTo(Site, { foreignKey: "siteId", as: "site" });
		}
	}

	Customer.init(
		{
			siteId: {
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
		},
		{
			sequelize,
			modelName: "Customer",
		},
	);

	return Customer;
};
