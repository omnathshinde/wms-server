import { Site } from "#src/index.js";

export const getAll = async (req, res) => {
	const { offset, limit, status, name } = req.query;
	const options = req.queryBuilder
		.paginate(offset, limit)
		.status(status)
		.equal("name", name)
		.toQueryOptions();
	const data = await Site.findAndCountAll(options);
	return res.sendSuccess(200, data);
};

export const search = async (req, res) => {
	const { offset, limit, status, name } = req.query;
	const options = req.queryBuilder
		.paginate(offset, limit)
		.status(status)
		.like("name", name)
		.toQueryOptions();
	const data = await Site.findAndCountAll(options);
	return res.sendSuccess(200, data);
};

export const getOne = async (req, res) => {
	const data = await Site.findByPk(req.params.id);
	if (!data) {
		res.sendError(404, "Site not found");
	}
	return res.sendSuccess(200, data);
};

export const create = async (req, res) => {
	await Site.create(req.body);
	return res.sendSuccess(200, "Site created successfully");
};

export const update = async (req, res) => {
	const [updatedRows] = await Site.update(req.body, { where: { id: req.params.id } });
	if (updatedRows === 0) {
		return res.sendError(404, "Site not found");
	}
	return res.sendSuccess(200, "Site updated successfully");
};

export const destroy = async (req, res) => {
	const data = await Site.destroy({
		where: { id: req.params.id },
	});
	if (!data) {
		return res.sendError(404, "Site not found");
	}
	return res.sendSuccess(200, "Site deleted successfully");
};

export const restore = async (req, res) => {
	const data = await Site.restore({ where: { id: req.params.id } });
	if (!data) {
		return res.sendError(404, "Site not found");
	}
	return res.sendSuccess(200, "Site restored successfully");
};

export const bulkCreate = async (req, res) => {
	const data = await Site.bulkCreate(req.body, { ignoreDuplicates: true });
	return res.sendSuccess(201, `${data.length} sites created successfully`);
};
