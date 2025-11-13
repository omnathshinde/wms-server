import { DataTypes, Model } from "sequelize";

export default (sequelize) => {
	class Inward extends Model {
		static associate({ Site, Material, Shelf, User, Picklist }) {
			this.belongsTo(Site, { foreignKey: "siteId", as: "site" });
			this.belongsTo(Shelf, { foreignKey: "shelfId", as: "shelf" });
			this.belongsTo(Material, { foreignKey: "materialId", as: "material" });
			this.belongsTo(User, { foreignKey: "pickerId", as: "picker" });
			this.belongsTo(Picklist, { foreignKey: "picklistId", as: "picklist" });
		}
	}

	Inward.init(
		{
			siteId: {
				type: DataTypes.INTEGER,
				allowNull: false,
			},
			barcode: {
				type: DataTypes.STRING,
				allowNull: false,
				unique: true,
			},
			autoSerial: {
				type: DataTypes.BOOLEAN,
				allowNull: false,
				defaultValue: false,
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
			mrp: {
				type: DataTypes.BOOLEAN,
				allowNull: false,
				defaultValue: 0,
			},
			quantity: {
				type: DataTypes.INTEGER,
				allowNull: false,
				defaultValue: 1,
			},
			batch: {
				type: DataTypes.STRING,
				allowNull: false,
			},
			invoice: {
				type: DataTypes.STRING,
				allowNull: false,
			},
			manufacturingDate: {
				type: DataTypes.STRING,
				allowNull: false,
			},
			qcStatus: {
				type: DataTypes.ENUM("Pending", "Approved", "Rejected"),
				allowNull: false,
				defaultValue: "Pending",
			},
			qcRemark: {
				type: DataTypes.STRING,
				allowNull: true,
			},
			isPutAway: {
				type: DataTypes.BOOLEAN,
				allowNull: false,
				defaultValue: false,
			},
			shelfId: {
				type: DataTypes.INTEGER,
				allowNull: true,
			},
			shelfName: {
				type: DataTypes.STRING,
				allowNull: true,
			},
			recommandedShelf: {
				type: DataTypes.STRING,
				allowNull: true,
			},
			isPicked: {
				type: DataTypes.BOOLEAN,
				allowNull: false,
				defaultValue: false,
			},
			pickerId: {
				type: DataTypes.INTEGER,
				allowNull: true,
			},
			picklistId: {
				type: DataTypes.INTEGER,
				allowNull: true,
			},
			picklistName: {
				type: DataTypes.STRING,
				allowNull: true,
			},
			pickedBy: {
				type: DataTypes.STRING,
				allowNull: true,
			},
			isDispatch: {
				type: DataTypes.BOOLEAN,
				allowNull: false,
				defaultValue: false,
			},
			dispatchAt: {
				type: DataTypes.DATE,
				allowNull: true,
			},
			dispatchBy: {
				type: DataTypes.STRING,
				allowNull: true,
			},
			isReturn: {
				type: DataTypes.BOOLEAN,
				allowNull: false,
				defaultValue: false,
			},
			returnAt: {
				type: DataTypes.DATE,
				allowNull: true,
			},
			returnBy: {
				type: DataTypes.STRING,
				allowNull: true,
			},
			inStock: {
				type: DataTypes.BOOLEAN,
				allowNull: false,
				defaultValue: true,
			},
			auditStatus: {
				type: DataTypes.ENUM("Found", "Not Found", "Scrapped", "Manually Approved"),
				allowNull: false,
				defaultValue: "Found",
			},
			auditRemark: {
				type: DataTypes.STRING,
				allowNull: true,
			},
			auditAt: {
				type: DataTypes.DATE,
				allowNull: true,
			},
			auditBy: {
				type: DataTypes.STRING,
				allowNull: true,
			},
		},
		{
			sequelize,
			modelName: "Inward",
		},
	);

	return Inward;
};
