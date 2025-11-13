import { Customer, Site } from "#src/index.js";

export const getAll = async (req, res) => {
	const { offset, limit, status, name, description, siteName } = req.query;
	const options = req.queryBuilder
		.site(req)
		.status(status)
		.paginate(offset, limit)
		.equal("name", name)
		.equal("description", description)
		.equal("site.name", siteName, Site)
		.includeModel("site", Site, {
			attributes: ["id", "name"],
		})
		.toQueryOptions();
	const data = await Customer.findAndCountAll(options);
	return res.sendSuccess(200, data);
};

export const search = async (req, res) => {
	const { offset, limit, status, name, description, siteName } = req.query;
	const options = req.queryBuilder
		.site(req)
		.status(status)
		.paginate(offset, limit)
		.like("name", name)
		.like("description", description)
		.like("site.name", siteName, Site)
		.includeModel("site", Site, {
			attributes: ["id", "name"],
		})
		.toQueryOptions();
	const data = await Customer.findAndCountAll(options);
	return res.sendSuccess(200, data);
};

export const getOne = async (req, res) => {
	const data = await Customer.findByPk(req.params.id);
	if (!data) {
		res.sendError(404, "Customer not found");
	}
	return res.sendSuccess(200, data);
};

export const create = async (req, res) => {
	await Customer.create(req.body);
	return res.sendSuccess(200, "Customer created successfully");
};

export const update = async (req, res) => {
	const [updatedRows] = await Customer.update(req.body, { where: { id: req.params.id } });
	if (updatedRows === 0) {
		return res.sendError(404, "Customer not found");
	}
	return res.sendSuccess(200, "Customer updated successfully");
};

export const destroy = async (req, res) => {
	const data = await Customer.destroy({
		where: { id: req.params.id },
	});
	if (!data) {
		return res.sendError(404, "Customer not found");
	}
	return res.sendSuccess(200, "Customer deleted successfully");
};

export const restore = async (req, res) => {
	await Customer.restore({ where: { id: req.params.id } });
	return res.sendSuccess(200, "Customer restored successfully");
};

export const bulkCreate = async (req, res) => {
	const data = await Customer.bulkCreate(req.body, { ignoreDuplicates: true });
	return res.sendSuccess(201, `${data.length} customer created successfully`);
};
