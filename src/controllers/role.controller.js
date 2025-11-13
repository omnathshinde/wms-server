import { Role } from "#src/index.js";

export const getAll = async (req, res) => {
	const { offset, limit, name, status } = req.query;
	const options = req.queryBuilder
		.paginate(offset, limit)
		.like("name", name)
		.status(status)
		.toQueryOptions();
	const data = await Role.findAndCountAll(options);
	return res.sendSuccess(200, data);
};

export const search = async (req, res) => {
	const { offset, limit, name, status } = req.query;
	const options = req.queryBuilder
		.paginate(offset, limit)
		.like("name", name)
		.status(status)
		.toQueryOptions();
	const data = await Role.findAndCountAll(options);
	return res.sendSuccess(200, data);
};

export const getOne = async (req, res) => {
	const data = await Role.findByPk(req.params.id);
	if (!data) {
		res.sendError(404, "Role not found");
	}
	return res.sendSuccess(200, data);
};

export const create = async (req, res) => {
	await Role.create(req.body);
	return res.sendSuccess(200, "Role created successfully");
};

export const update = async (req, res) => {
	const [updatedRows] = await Role.update(req.body, { where: { id: req.params.id } });
	if (updatedRows === 0) {
		return res.sendError(404, "Role not found");
	}
	return res.sendSuccess(200, "Role updated successfully");
};

export const destroy = async (req, res) => {
	const data = await Role.destroy({
		where: { id: req.params.id },
	});
	if (!data) {
		return res.sendError(404, "Role not found");
	}
	return res.sendSuccess(200, "Role deleted successfully");
};

export const restore = async (req, res) => {
	const data = await Role.restore({ where: { id: req.params.id } });
	if (!data) {
		return res.sendError(404, "Role not found");
	}
	return res.sendSuccess(200, "Role restored successfully");
};

export const bulkCreate = async (req, res) => {
	const data = await Role.bulkCreate(req.body, { ignoreDuplicates: true });
	return res.sendSuccess(201, `${data.length} roles created successfully`);
};
