import { AuditItem } from "#src/index.js";

export const getAll = async (req, res) => {
	const {
		offset,
		limit,
		status,
		auditId,
		materialId,
		materialName,
		materialDescription,
	} = req.query;
	const data = await req.queryBuilder
		.status(status)
		.paginate(offset, limit)
		.equal("auditId", auditId)
		.equal("materialId", materialId)
		.equal("materialName", materialName)
		.equal("materialDescription", materialDescription)
		.findAndCountAll(AuditItem);
	return res.sendSuccess(200, data);
};

export const search = async (req, res) => {
	const {
		offset,
		limit,
		status,
		auditId,
		materialId,
		materialName,
		materialDescription,
	} = req.query;
	const data = await req.queryBuilder
		.status(status)
		.paginate(offset, limit)
		.equal("auditId", auditId)
		.equal("materialId", materialId)
		.equal("materialName", materialName)
		.equal("materialDescription", materialDescription)
		.findAndCountAll(AuditItem);
	return res.sendSuccess(200, data);
};
