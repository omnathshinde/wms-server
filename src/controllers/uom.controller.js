import { Uom } from "#src/index.js";

export const getAll = async (req, res) => {
	const { offset, limit, name, status } = req.query;
	const options = req.queryBuilder
		.paginate(offset, limit)
		.like("name", name)
		.status(status)
		.toQueryOptions();
	const data = await Uom.findAndCountAll(options);
	return res.sendSuccess(200, data);
};

export const search = async (req, res) => {
	const { offset, limit, name, status } = req.query;
	const options = req.queryBuilder
		.paginate(offset, limit)
		.like("name", name)
		.status(status)
		.toQueryOptions();
	const data = await Uom.findAndCountAll(options);
	return res.sendSuccess(200, data);
};

export const getOne = async (req, res) => {
	const data = await Uom.findByPk(req.params.id);
	if (!data) {
		res.sendError(404, "Uom not found");
	}
	return res.sendSuccess(200, data);
};

export const create = async (req, res) => {
	await Uom.create(req.body);
	return res.sendSuccess(200, "Uom created successfully");
};

export const update = async (req, res) => {
	const [updatedRows] = await Uom.update(req.body, { where: { id: req.params.id } });
	if (updatedRows === 0) {
		return res.sendError(404, "Uom not found");
	}
	return res.sendSuccess(200, "Uom updated successfully");
};

export const destroy = async (req, res) => {
	const data = await Uom.destroy({
		where: { id: req.params.id },
	});
	if (!data) {
		return res.sendError(404, "Uom not found");
	}
	return res.sendSuccess(200, "Uom deleted successfully");
};

export const restore = async (req, res) => {
	const data = await Uom.restore({ where: { id: req.params.id } });
	if (!data) {
		return res.sendError(404, "UOM not found");
	}
	return res.sendSuccess(200, "UOM restored successfully");
};

export const bulkCreate = async (req, res) => {
	const data = await Uom.bulkCreate(req.body, { ignoreDuplicates: true });
	return res.sendSuccess(201, `${data.length} roles created successfully`);
};
