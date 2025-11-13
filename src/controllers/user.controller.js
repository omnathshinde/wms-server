import { Role, Site, User } from "#src/index.js";

export const getAll = async (req, res) => {
	const { offset, limit, status, username, name, employeeId, roleId, roleName } =
		req.query;
	const options = req.queryBuilder
		.site(req, User)
		.status(status)
		.paginate(offset, limit)
		.equal("username", username)
		.equal("name", name)
		.equal("employeeId", employeeId)
		.equal("roleId", roleId)
		.includeModel("role", Role, { attributes: ["id", "name"] })
		.includeModel("site", Site, { attributes: ["id", "name"] })
		.equal("role.name", roleName)
		.toQueryOptions();

	options.attributes = { exclude: ["password"] };
	const data = await User.findAndCountAll(options);
	return res.sendSuccess(200, data);
};

export const search = async (req, res) => {
	const { offset, limit, status, username, name, employeeId, roleId, roleName } =
		req.query;
	const options = req.queryBuilder
		.site(req, User)
		.status(status)
		.paginate(offset, limit)
		.like("username", username)
		.like("name", name)
		.like("employeeId", employeeId)
		.equal("roleId", roleId)
		.includeModel("role", Role, { attributes: ["id", "name"] })
		.includeModel("site", Site, { attributes: ["id", "name"] })
		.equal("role.name", roleName)
		.toQueryOptions();
	options.attributes = { exclude: ["password"] };
	const data = await User.findAndCountAll(options);
	return res.sendSuccess(200, data);
};

export const getOne = async (req, res) => {
	const data = await User.findByPk(req.params.id);
	if (!data) {
		res.sendError(404, "User not found");
	}
	return res.sendSuccess(200, data);
};

export const create = async (req, res) => {
	await User.create(req.body);
	return res.sendSuccess(200, "User created successfully");
};

export const update = async (req, res) => {
	const data = await User.update(req.body, { where: { id: req.params.id } });
	if (data[0] === 0) {
		return res.sendError(404, "User not found");
	}
	return res.sendSuccess(200, "User updated successfully");
};

export const destroy = async (req, res) => {
	const data = await User.destroy({
		where: { id: req.params.id },
		// force: true, // for hard delete
	});
	if (!data) {
		return res.sendError(404, "User not found");
	}
	return res.sendSuccess(200, "User deleted successfully");
};

export const restore = async (req, res) => {
	const data = await User.restore({ where: { id: req.params.id } });
	if (!data) {
		return res.sendError(404, "User not found");
	}
	return res.sendSuccess(200, "User restored successfully");
};

export const bulkCreate = async (req, res) => {
	const data = await User.bulkCreate(req.body, { ignoreDuplicates: true });
	return res.sendSuccess(201, `${data.length} users created successfully`);
};

export const bulkUpdate = async (req, res) => {
	const { filter, data } = req.body;
	const [count] = await User.update(data, {
		where: filter,
		individualHooks: true, // run beforeUpdate per-instance (audit)
		user: req.user,
	});
	res.sendSuccess(200, `${count} users updated`, { count });
};

export const bulkDelete = async (req, res) => {
	const { filter } = req.body;
	// with your global beforeBulkDestroy hook, individualHooks is already applied
	const count = await User.destroy({
		where: filter,
	});
	res.sendSuccess(200, { count }, `${count} users deleted`);
};
