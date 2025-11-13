import { Op } from "sequelize";

import { Rack, Site, Zone } from "#src/index.js";

const parsePagination = (offset, limit) => ({
	offset: Number.isFinite(Number(offset)) ? Number(offset) : 0,
	limit: Number.isFinite(Number(limit)) ? Number(limit) : 100,
});

const buildIncludes = ({ zoneName, siteName }, operator = Op.like) => {
	const makeCondition = (value) => {
		if (!value) return null;
		return operator === Op.like
			? { name: { [Op.like]: `%${value}%` } }
			: { name: { [Op.eq]: value } };
	};

	const zoneCondition = makeCondition(zoneName);
	const siteCondition = makeCondition(siteName);

	const siteInclude = {
		model: Site,
		as: "site",
		attributes: ["id", "name"],
		required: !!siteCondition,
		...(siteCondition ? { where: siteCondition } : {}),
	};

	const zoneInclude = {
		model: Zone,
		as: "zone",
		attributes: ["id", "name"],
		required: !!zoneCondition || !!siteCondition,
		...(zoneCondition ? { where: zoneCondition } : {}),
		include: [siteInclude],
	};

	return [zoneInclude];
};

const getParanoidOptions = (status) => {
	if (status == 1 || status === "1" || status === true || status === "true") {
		return { paranoid: true, whereStatus: {} }; // active only
	}
	if (status == 0 || status === "0" || status === false || status === "false") {
		return { paranoid: false, whereStatus: { deletedAt: { [Op.not]: null } } };
	}
	return { paranoid: true, whereStatus: {} };
};

export const getAll = async (req, res) => {
	try {
		const { offset, limit, status, name, zoneId, zoneName, siteName } = req.query;
		const { offset: off, limit: lim } = parsePagination(offset, limit);
		const { paranoid, whereStatus } = getParanoidOptions(status);

		const where = { ...whereStatus };
		if (name) where.name = { [Op.eq]: name };
		if (zoneId) where.zoneId = zoneId;

		const include = buildIncludes({ zoneName, siteName }, Op.eq);

		const data = await Rack.findAndCountAll({
			where,
			include,
			offset: off,
			limit: lim,
			paranoid,
			order: [["id", "DESC"]],
		});

		return res.sendSuccess(200, data);
	} catch (err) {
		console.error("Rack getAll error:", err);
		return res.sendError(500, "Something went wrong", err.message);
	}
};

export const search = async (req, res) => {
	try {
		const { offset, limit, status, name, zoneId, zoneName, siteName } = req.query;
		const { offset: off, limit: lim } = parsePagination(offset, limit);
		const { paranoid, whereStatus } = getParanoidOptions(status);

		const where = { ...whereStatus };
		if (name) where.name = { [Op.like]: `%${name}%` };
		if (zoneId) where.zoneId = zoneId;

		const include = buildIncludes({ zoneName, siteName }, Op.like);

		const data = await Rack.findAndCountAll({
			where,
			include,
			offset: off,
			limit: lim,
			paranoid,
			order: [["id", "DESC"]],
		});

		return res.sendSuccess(200, data);
	} catch (err) {
		console.error("Rack search error:", err);
		return res.sendError(500, "Something went wrong", err.message);
	}
};

export const getOne = async (req, res) => {
	const options = req.queryBuilder
		.includeModel("zone", Zone, {
			attributes: ["id", "name"],
		})
		.toQueryOptions();
	const data = await Rack.findByPk(req.params.id, options);
	if (!data) {
		res.sendError(404, "Rack not found");
	}
	return res.sendSuccess(200, data);
};

export const create = async (req, res) => {
	await Rack.create(req.body);
	return res.sendSuccess(200, "Rack created successfully");
};

export const update = async (req, res) => {
	const [updatedRows] = await Rack.update(req.body, { where: { id: req.params.id } });
	if (updatedRows === 0) {
		return res.sendError(404, "Rack not found");
	}
	return res.sendSuccess(200, "Rack updated successfully");
};

export const destroy = async (req, res) => {
	const data = await Rack.destroy({
		where: { id: req.params.id },
	});
	if (!data) {
		return res.sendError(404, "Rack not found");
	}
	return res.sendSuccess(200, "Rack deleted successfully");
};

export const restore = async (req, res) => {
	await Rack.restore({ where: { id: req.params.id } });
	return res.sendSuccess(200, "Rack restored successfully");
};

export const bulkCreate = async (req, res) => {
	const { transaction } = req;
	const racks = req.body;
	const { siteId: userSiteId } = req.user;

	if (!Array.isArray(racks) || racks.length === 0) {
		return res.sendError(400, "Request body must be a non-empty array of racks.");
	}

	let rackData = [];
	const siteNames = [...new Set(racks.map((r) => r.siteName?.trim()).filter(Boolean))];
	const zoneNames = [...new Set(racks.map((r) => r.zoneName?.trim()).filter(Boolean))];

	const sites = await Site.findAll({
		where: { name: siteNames },
		attributes: ["id", "name"],
		transaction,
	});

	const siteMap = new Map(sites.map((s) => [s.name, s.id]));

	const zones = await Zone.findAll({
		where: { name: zoneNames },
		attributes: ["id", "name", "siteId"],
		transaction,
	});

	const zoneMap = new Map(zones.map((z) => [`${z.siteId}-${z.name}`, z.id]));

	for (const r of racks) {
		let siteId;
		let zoneId;

		if (userSiteId == null) {
			siteId = siteMap.get(r.siteName?.trim());
			if (!siteId) {
				return res.sendError(400, `Invalid siteName: ${r.siteName}`);
			}
		} else {
			siteId = userSiteId;
		}

		const zoneKey = `${siteId}-${r.zoneName?.trim()}`;
		zoneId = zoneMap.get(zoneKey);
		if (!zoneId) {
			return res.sendError(
				400,
				`Invalid zoneName '${r.zoneName}' for site '${r.siteName || "current user site"}'`,
			);
		}

		if (!r.rackName) continue;

		rackData.push({
			siteId,
			zoneId,
			name: r.rackName.trim(),
		});
	}

	if (rackData.length === 0) {
		return res.sendError(400, "No valid rack entries found.");
	}

	const createdRacks = await Rack.bulkCreate(rackData, {
		ignoreDuplicates: true,
		transaction,
	});

	return res.sendSuccess(201, `${createdRacks.length} racks created successfully.`);
};
