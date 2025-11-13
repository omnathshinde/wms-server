import sequelize from "#db/index.js";
import { tables } from "#db/index.js";

export { sequelize };
export const {
	Access,
	Role,
	RoleAccess,
	Site,
	User,
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
