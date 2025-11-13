import { DataTypes, Model } from "sequelize";

export default (sequelize) => {
	class Material extends Model {
		static associate({ Site }) {
			this.belongsTo(Site, { foreignKey: "siteId", as: "site" });
		}
	}

	Material.init(
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
			customerName: {
				type: DataTypes.STRING,
				allowNull: false,
			},
			UOM: {
				type: DataTypes.STRING,
				allowNull: true,
			},
			netWeight: {
				type: DataTypes.FLOAT,
				allowNull: true,
			},
			netVolume: {
				type: DataTypes.FLOAT,
				allowNull: true,
			},
			quantity: {
				type: DataTypes.INTEGER,
				allowNull: false,
				defaultValue: 0,
			},
		},
		{
			sequelize,
			modelName: "Material",
		},
	);

	return Material;
};
