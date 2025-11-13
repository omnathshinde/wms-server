import { DataTypes, Model } from "sequelize";

export default (sequelize) => {
	class PicklistPicker extends Model {
		static associate({ Picklist, User }) {
			this.belongsTo(Picklist, { foreignKey: "picklistId", as: "picklist" });
			this.belongsTo(User, { foreignKey: "currentPickerId", as: "currentPicker" });
			this.belongsTo(User, { foreignKey: "previousPickerId", as: "previousPicker" });
		}
	}

	PicklistPicker.init(
		{
			picklistId: {
				type: DataTypes.INTEGER,
				allowNull: false,
			},
			currentPickerId: {
				type: DataTypes.INTEGER,
				allowNull: false,
			},
			previousPickerId: {
				type: DataTypes.INTEGER,
				allowNull: true,
			},
		},
		{
			sequelize,
			modelName: "PicklistPicker",
		},
	);

	return PicklistPicker;
};
