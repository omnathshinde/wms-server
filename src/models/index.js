import sequelize, { tables } from "#src/app/database/index.js";

export { sequelize };
export const {
	Access,
	Role,
	RoleAccess,
	User,
	Site,
	Zone,
	Rack,
	Shelf,
	Uom,
	Material,
	Customer,
	Inward,
	QC,
	Putaway,
	Picklist,
	PicklistItem,
	PicklistItemBarcode,
	PicklistPicker,
	FifoViolation,
	ReturnBarcode,
	Audit,
	AuditItem,
	AuditItemBarcode,
} = tables;
