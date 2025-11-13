import { Op } from "sequelize";

import { Rack, Shelf, Site, Zone } from "#src/index.js";

const parsePagination = (offset, limit) => {
	const parsedOffset = Number(offset);
	const parsedLimit = Number(limit);

	return {
		offset: Number.isFinite(parsedOffset) && parsedOffset >= 0 ? parsedOffset : 0,
		limit: Number.isFinite(parsedLimit) && parsedLimit > 0 ? parsedLimit : undefined,
	};
};

const buildIncludes = ({ rackName, zoneName, siteName, siteId }, operator = Op.like) => {
	const makeCondition = (value, key = "name") => {
		if (!value) return null;
		return operator === Op.like
			? { [key]: { [Op.like]: `%${value}%` } }
			: { [key]: { [Op.eq]: value } };
	};

	const rackCondition = makeCondition(rackName);
	const zoneCondition = makeCondition(zoneName);
	const siteCondition = makeCondition(siteName);
	const siteIdCondition = makeCondition(siteId, "id");

	const siteWhere = siteCondition || siteIdCondition;

	const siteInclude = {
		model: Site,
		as: "site",
		attributes: ["id", "name"],
		required: !!siteWhere,
		...(siteWhere ? { where: siteWhere } : {}),
	};

	const zoneInclude = {
		model: Zone,
		as: "zone",
		attributes: ["id", "name"],
		required: !!zoneCondition || !!siteWhere,
		...(zoneCondition ? { where: zoneCondition } : {}),
		include: [siteInclude],
	};

	const rackInclude = {
		model: Rack,
		as: "rack",
		attributes: ["id", "name"],
		required: !!rackCondition || !!zoneCondition || !!siteWhere,
		...(rackCondition ? { where: rackCondition } : {}),
		include: [zoneInclude],
	};

	return [rackInclude];
};

const getParanoidOptions = (status) => {
	if (status == 1 || status === "1" || status === true || status === "true") {
		return { paranoid: true, whereStatus: {} };
	}
	if (status == 0 || status === "0" || status === false || status === "false") {
		return { paranoid: false, whereStatus: { deletedAt: { [Op.not]: null } } };
	}
	return { paranoid: true, whereStatus: {} };
};

const applyUserSiteFilter = (where, include, userSiteId) => {
	if (!userSiteId) return include;

	if (Shelf.rawAttributes.siteId) {
		where.siteId = userSiteId;
	} else {
		const rackInclude = include[0];
		const zoneInclude = rackInclude?.include?.[0];
		const siteInclude = zoneInclude?.include?.[0];
		if (siteInclude) {
			siteInclude.required = true;
			siteInclude.where = { id: userSiteId };
		}
	}
	return include;
};

export const getAll = async (req, res) => {
	try {
		const { offset, limit, status, name, barcode, rackId, rackName, zoneName, siteName } =
			req.query;
		const userSiteId = req.user?.siteId;
		const { offset: off, limit: lim } = parsePagination(offset, limit);
		const { paranoid, whereStatus } = getParanoidOptions(status);

		const where = { ...whereStatus };
		if (name) where.name = { [Op.eq]: name };
		if (barcode) where.barcode = { [Op.eq]: barcode };
		if (rackId) where.rackId = rackId;

		let include = buildIncludes(
			{ rackName, zoneName, siteName, siteId: userSiteId },
			Op.eq,
		);
		include = applyUserSiteFilter(where, include, userSiteId);

		const data = await Shelf.findAndCountAll({
			where,
			include,
			offset: off,
			limit: lim,
			paranoid,
			order: [["id", "DESC"]],
		});

		return res.sendSuccess(200, data);
	} catch (err) {
		return res.sendError(err);
	}
};

export const search = async (req, res) => {
	try {
		const { offset, limit, status, name, barcode, rackId, rackName, zoneName, siteName } =
			req.query;
		const userSiteId = req.user?.siteId;

		const { offset: off, limit: lim } = parsePagination(offset, limit);
		const { paranoid, whereStatus } = getParanoidOptions(status);

		const where = { ...whereStatus };
		if (name) where.name = { [Op.like]: `%${name}%` };
		if (barcode) where.barcode = { [Op.like]: `%${barcode}%` };
		if (rackId) where.rackId = rackId;

		let include = buildIncludes(
			{ rackName, zoneName, siteName, siteId: userSiteId },
			Op.like,
		);
		include = applyUserSiteFilter(where, include, userSiteId);

		const data = await Shelf.findAndCountAll({
			where,
			include,
			offset: off,
			limit: lim,
			paranoid,
			order: [["id", "DESC"]],
		});

		return res.sendSuccess(200, data);
	} catch (err) {
		return res.sendError(err);
	}
};

export const getOne = async (req, res) => {
	const options = req.queryBuilder
		.includeModel("rack", Rack, {
			attributes: ["id", "name"],
		})
		.toQueryOptions();
	const data = await Shelf.findByPk(req.params.id, options);
	if (!data) {
		res.sendError(404, "Shelf not found");
	}
	return res.sendSuccess(200, data);
};

export const create = async (req, res) => {
	const {
		siteId,
		zoneId,
		rackId,
		name,
		description,
		capacity = 0,
		volume = 0,
	} = req.body;

	// ---------- VALIDATION ----------
	if (!siteId || !zoneId || !rackId || !name) {
		return res.sendError(400, "Missing required fields");
	}

	// ---------- FIND LAST SHELF FOR THIS RACK ----------
	const lastShelf = await Shelf.findOne({
		where: { rackId },
		order: [["id", "DESC"]],
		attributes: ["barcode"],
	});

	// ---------- GENERATE NEXT BARCODE ----------
	const pad4 = (num) => String(num).padStart(4, "0");
	const pad5 = (num) => String(num).padStart(5, "0");

	let lastSerial = 0;
	if (lastShelf?.barcode) {
		const parts = lastShelf.barcode.split("-");
		lastSerial = parseInt(parts[3] || "0", 10);
	}

	const nextSerial = lastSerial + 1;
	const barcode = [pad4(siteId), pad4(zoneId), pad4(rackId), pad5(nextSerial)].join("-");

	// ---------- CREATE SHELF ----------
	const shelf = await Shelf.create({
		siteId,
		zoneId,
		rackId,
		name,
		barcode,
		description,
		capacity,
		volume,
	});

	// ---------- RESPONSE ----------
	return res.sendSuccess(200, {
		message: "Shelf created successfully",
		data: shelf,
	});
};

export const update = async (req, res) => {
	const [updatedRows] = await Shelf.update(req.body, { where: { id: req.params.id } });
	if (updatedRows === 0) {
		return res.sendError(404, "Shelf not found");
	}
	return res.sendSuccess(200, "Shelf updated successfully");
};

export const destroy = async (req, res) => {
	const data = await Shelf.destroy({
		where: { id: req.params.id },
	});
	if (!data) {
		return res.sendError(404, "Shelf not found");
	}
	return res.sendSuccess(200, "Shelf deleted successfully");
};

export const restore = async (req, res) => {
	const data = await Shelf.restore({ where: { id: req.params.id } });
	if (!data) {
		return res.sendError(404, "Shelf not found");
	}
	return res.sendSuccess(200, "Shelf restored successfully");
};

export const bulkCreate = async (req, res) => {
	const { transaction } = req;
	const shelves = req.body;
	const { siteId: userSiteId } = req.user;

	if (!Array.isArray(shelves) || shelves.length === 0) {
		return res.sendError(400, "Request body must be a non-empty array of shelves.");
	}

	let shelfData = [];

	// ---------- LOOKUPS ----------
	const siteNames = [...new Set(shelves.map((s) => s.siteName?.trim()).filter(Boolean))];
	const zoneNames = [...new Set(shelves.map((s) => s.zoneName?.trim()).filter(Boolean))];
	const rackNames = [...new Set(shelves.map((s) => s.rackName?.trim()).filter(Boolean))];

	// Admin: must use siteName, Normal user: ignore
	const sites = await Site.findAll({
		where: { name: siteNames },
		attributes: ["id", "name"],
		transaction,
	});
	const siteMap = new Map(sites.map((s) => [s.name, s.id]));

	// Zones: belong to sites
	const zones = await Zone.findAll({
		where: { name: zoneNames },
		attributes: ["id", "name", "siteId"],
		transaction,
	});
	const zoneMap = new Map(zones.map((z) => [`${z.siteId}-${z.name}`, z.id]));

	// Racks: belong to zones
	const racks = await Rack.findAll({
		where: { name: rackNames },
		attributes: ["id", "name", "zoneId"],
		transaction,
	});
	const rackMap = new Map(racks.map((r) => [`${r.zoneId}-${r.name}`, r.id]));

	// ---------- BARCODE HELPERS ----------
	const pad4 = (num) => String(num).padStart(4, "0");
	const pad5 = (num) => String(num).padStart(5, "0");

	// ---------- BUILD PAYLOAD ----------
	for (const s of shelves) {
		let siteId;
		let zoneId;
		let rackId;

		// Admin resolves siteId from siteName
		if (userSiteId == null) {
			siteId = siteMap.get(s.siteName?.trim());
			if (!siteId) {
				return res.sendError(400, `Invalid siteName: ${s.siteName}`);
			}
		} else {
			siteId = userSiteId;
		}

		// Find zone in this site
		const zoneKey = `${siteId}-${s.zoneName?.trim()}`;
		zoneId = zoneMap.get(zoneKey);
		if (!zoneId) {
			return res.sendError(
				400,
				`Invalid zoneName '${s.zoneName}' for site '${s.siteName || "current site"}'`,
			);
		}

		// Find rack in this zone
		const rackKey = `${zoneId}-${s.rackName?.trim()}`;
		rackId = rackMap.get(rackKey);
		if (!rackId) {
			return res.sendError(
				400,
				`Invalid rackName '${s.rackName}' in zone '${s.zoneName}'`,
			);
		}

		if (!s.shelfName) continue;

		// ---------- Find last shelf for this rack ----------
		const lastShelf = await Shelf.findOne({
			where: { rackId },
			order: [["id", "DESC"]],
			attributes: ["barcode"],
			transaction,
		});

		let lastSerial = 0;
		if (lastShelf?.barcode) {
			const parts = lastShelf.barcode.split("-");
			lastSerial = parseInt(parts[3] || "0", 10);
		}

		const nextSerial = lastSerial + 1;
		const barcode = [pad4(siteId), pad4(zoneId), pad4(rackId), pad5(nextSerial)].join(
			"-",
		);

		shelfData.push({
			rackId,
			name: s.shelfName.trim(),
			barcode,
			description: s.description || null,
			capacity: s.capacity || 0,
			volume: s.volume || 0,
		});
	}

	if (shelfData.length === 0) {
		return res.sendError(400, "No valid shelf entries found.");
	}

	// ---------- CREATE SHELVES ----------
	const createdShelves = await Shelf.bulkCreate(shelfData, {
		ignoreDuplicates: true,
		transaction,
	});

	return res.sendSuccess(201, `${createdShelves.length} shelves created successfully.`);
};
