import { Site, Zone } from "#src/index.js";

export const getAll = async (req, res) => {
	const { offset, limit, status, name, siteId, siteName } = req.query;
	const data = await req.queryBuilder
		.site(req)
		.paginate(offset, limit)
		.status(status)
		.equal("name", name)
		.equal("siteId", siteId)
		.equal("site.name", siteName, Site)
		.includeModel("site", Site, {
			attributes: ["id", "name"],
		})
		.findAndCountAll(Zone);
	return res.sendSuccess(200, data);
};

export const search = async (req, res) => {
	const { offset, limit, status, name, siteId, siteName } = req.query;
	const data = await req.queryBuilder
		.paginate(offset, limit)
		.status(status)
		.like("name", name)
		.like("siteId", siteId)
		.like("site.name", siteName, Site)
		.includeModel("site", Site, {
			attributes: ["id", "name"],
		})
		.findAndCountAll(Zone);
	return res.sendSuccess(200, data);
};

export const getOne = async (req, res) => {
	const options = req.queryBuilder
		.includeModel("site", Site, {
			attributes: ["id", "name"],
		})
		.toQueryOptions();
	const data = await Zone.findByPk(req.params.id, options);
	if (!data) {
		res.sendError(404, "Zone not found");
	}
	return res.sendSuccess(200, data);
};

export const create = async (req, res) => {
	await Zone.create(req.body);
	return res.sendSuccess(200, "Zone created successfully");
};

export const update = async (req, res) => {
	const [updatedRows] = await Zone.update(req.body, { where: { id: req.params.id } });
	if (updatedRows === 0) {
		return res.sendError(404, "Zone not found");
	}
	return res.sendSuccess(200, "Zone updated successfully");
};

export const destroy = async (req, res) => {
	const data = await Zone.destroy({
		where: { id: req.params.id },
	});
	if (!data) {
		return res.sendError(404, "Zone not found");
	}
	return res.sendSuccess(200, "Zone deleted successfully");
};

export const restore = async (req, res) => {
	const data = await Zone.restore({ where: { id: req.params.id } });
	if (!data) {
		return res.sendError(404, "Zone not found");
	}
	return res.sendSuccess(200, "Zone restored successfully");
};

export const bulkCreate = async (req, res) => {
	const { transaction } = req;
	const zones = req.body;
	const { siteId: userSiteId } = req.user;

	if (!Array.isArray(zones) || zones.length === 0) {
		return res.sendError(400, "Request body must be a non-empty array of zones");
	}

	let zoneData = [];

	if (userSiteId == null) {
		const siteNames = [...new Set(zones.map((z) => z.siteName?.trim()).filter(Boolean))];
		if (siteNames.length === 0) {
			return res.sendError(400, "Admin must include at least one valid siteName");
		}

		const sites = await Site.findAll({
			where: { name: siteNames },
			attributes: ["id", "name"],
			transaction,
		});

		const siteMap = new Map(sites.map((s) => [s.name, s.id]));
		const invalidSites = siteNames.filter((name) => !siteMap.has(name));

		if (invalidSites.length > 0) {
			return res.sendError(400, `Invalid site(s): ${invalidSites.join(", ")}`);
		}

		zoneData = zones.map((z) => ({
			siteId: siteMap.get(z.siteName),
			name: z.zoneName?.trim(),
		}));
	} else {
		zoneData = zones.map((z) => ({
			siteId: userSiteId,
			name: z.zoneName?.trim(),
		}));
	}

	zoneData = zoneData.filter((z) => z.siteId && z.name);

	if (zoneData.length === 0) {
		return res.sendError(400, "No valid zones to create.");
	}

	const createdZones = await Zone.bulkCreate(zoneData, {
		ignoreDuplicates: true,
		transaction,
	});

	return res.sendSuccess(201, `${createdZones.length} zones created successfully.`);
};
