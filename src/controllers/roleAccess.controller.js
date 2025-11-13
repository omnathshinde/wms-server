import { Access, RoleAccess } from "#src/index.js";

export const getAll = async (req, res) => {
	const { roleId } = req.query;
	const allAccess = await Access.findAll({
		attributes: ["id", "name"],
		raw: true,
	});
	const roleAccess = await RoleAccess.findAll({
		where: { roleId: parseInt(roleId) },
		attributes: ["accessId", "status"],
		raw: true,
	});
	const accessStatusMap = new Map(roleAccess.map((ra) => [ra.accessId, !!ra.status]));
	const result = allAccess.map((access) => ({
		name: access.name,
		accessId: access.id,
		roleId: parseInt(roleId),
		status: accessStatusMap.get(access.id) || false,
	}));
	return res.sendSuccess(200, result);
};

export const create = async (req, res) => {
	const { transaction } = req;
	const payload = req.body;
	for (const item of payload) {
		const { roleId, accessId, status } = item;
		if (!roleId || !accessId) continue;
		const existing = await RoleAccess.findOne({
			where: { roleId, accessId },
			transaction,
		});
		if (!existing) {
			await RoleAccess.create({ roleId, accessId, status }, { transaction });
		} else {
			await existing.update({ status }, { transaction });
		}
	}
	return res.sendSuccess(200, "Role access updated successfully");
};
