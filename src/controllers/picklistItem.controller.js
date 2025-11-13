import { Material, PicklistItem } from "#src/index.js";

export const getAll = async (req, res) => {
	const {
		offset,
		limit,
		status,
		picklistId,
		materialId,
		materialName,
		materialDescription,
	} = req.query;
	const data = await req.queryBuilder
		.status(status)
		.paginate(offset, limit)
		.equal("picklistId", picklistId)
		.equal("materialId", materialId)
		.equal("materialName", materialName)
		.equal("materialDescription", materialDescription)
		.findAndCountAll(PicklistItem);
	return res.sendSuccess(200, data);
};

export const search = async (req, res) => {
	const {
		offset,
		limit,
		status,
		picklistId,
		materialId,
		materialName,
		materialDescription,
	} = req.query;
	const data = await req.queryBuilder
		.status(status)
		.paginate(offset, limit)
		.equal("picklistId", picklistId)
		.equal("materialId", materialId)
		.equal("materialName", materialName)
		.equal("materialDescription", materialDescription)
		.findAndCountAll(PicklistItem);
	return res.sendSuccess(200, data);
};

export const getOne = async (req, res) => {
	const data = await PicklistItem.findByPk(req.params.id);
	if (!data) {
		res.sendError(404, "Picklist item not found");
	}
	return res.sendSuccess(200, data);
};

export const create = async (req, res) => {
	const { transaction } = req;
	const { picklistId, materialId, materialQuantity } = req.body;

	if (!picklistId || !materialId || !materialQuantity) {
		return res.sendError(
			400,
			"picklistId, materialId, and materialQuantity are required",
		);
	}

	const material = await Material.findByPk(materialId, { transaction });

	if (!material) {
		return res.sendError(404, "Material not found");
	}

	if (materialQuantity > material.quantity) {
		return res.sendError(400, "Cannot pick more than stock quantity");
	}

	const picklistItem = await PicklistItem.create(
		{
			picklistId,
			materialId,
			materialName: material.name,
			materialDescription: material.description || "N/A",
			materialQuantity,
		},
		{ transaction },
	);

	return res.sendSuccess(201, "Picklist item created successfully", picklistItem);
};
