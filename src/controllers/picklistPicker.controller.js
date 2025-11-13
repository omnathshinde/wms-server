import { Picklist, PicklistPicker, User } from "#src/index.js";

export const getAll = async (req, res) => {
	const { offset, limit, status, picklistId, currentPickerId, previousPickerId } =
		req.query;
	const data = await req.queryBuilder
		.status(status)
		.paginate(offset, limit)
		.equal("picklistId", picklistId)
		.equal("currentPickerId", currentPickerId)
		.equal("previousPickerId", previousPickerId)
		.includeModel("currentPicker", User, {
			attributes: ["id", "name"],
		})
		.includeModel("previousPicker", User, {
			attributes: ["id", "name"],
		})
		.findAndCountAll(PicklistPicker);
	return res.sendSuccess(200, data);
};

export const search = async (req, res) => {
	const { offset, limit, status, picklistId, currentPickerId, previousPickerId } =
		req.query;
	const data = await req.queryBuilder
		.status(status)
		.paginate(offset, limit)
		.equal("picklistId", picklistId)
		.equal("currentPickerId", currentPickerId)
		.equal("previousPickerId", previousPickerId)
		.includeModel("currentPicker", User, {
			attributes: ["id", "name"],
		})
		.includeModel("previousPicker", User, {
			attributes: ["id", "name"],
		})
		.findAndCountAll(PicklistPicker);
	return res.sendSuccess(200, data);
};

export const getOne = async (req, res) => {
	const data = await PicklistPicker.findByPk(req.params.id);
	if (!data) {
		res.sendError(404, "Putaway transaction not found");
	}
	return res.sendSuccess(200, data);
};

export const create = async (req, res) => {
	const { transaction } = req;
	const { picklistId, currentPickerId, previousPickerId } = req.body;

	if (!picklistId || !currentPickerId || !previousPickerId)
		return res.sendError(400, "Picklist and pickers field are required");

	const [updatedRows] = await Picklist.update(
		{ userId: currentPickerId },
		{
			where: { id: picklistId },
			transaction,
		},
	);

	if (updatedRows === 0) {
		return res.sendError(404, "Picklist not found");
	}

	await PicklistPicker.create(req.body, { transaction });

	return res.sendSuccess(201, "Picker transaction completed successfully");
};
