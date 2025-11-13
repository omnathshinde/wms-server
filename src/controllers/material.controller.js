import { Material, Site } from "#src/index.js";

export const getAll = async (req, res) => {
	const {
		inStock,
		offset,
		limit,
		status,
		name,
		description,
		customerName,
		uom,
		netWeight,
		netVolume,
		siteId,
		siteName,
	} = req.query;

	const data = await req.queryBuilder
		.paginate(offset, limit)
		.status(status)
		.site(req)
		.gt("quantity", inStock)
		.equal("name", name)
		.equal("description", description)
		.equal("customerName", customerName)
		.equal("UOM", uom)
		.equal("netWeight", netWeight)
		.equal("netVolume", netVolume)
		.equal("siteId", siteId)
		.equal("site.name", siteName, Site)
		.includeModel("site", Site, {
			attributes: ["id", "name"],
		})
		.findAndCountAll(Material);
	return res.sendSuccess(200, data);
};

export const search = async (req, res) => {
	const {
		inStock,
		offset,
		limit,
		status,
		name,
		description,
		customerName,
		uom,
		netWeight,
		netVolume,
		siteId,
		siteName,
	} = req.query;

	const data = await req.queryBuilder
		.paginate(offset, limit)
		.site(req)
		.status(status)
		.gt("quantity", inStock)
		.like("name", name)
		.like("description", description)
		.like("customerName", customerName)
		.like("UOM", uom)
		.like("netWeight", netWeight)
		.like("netVolume", netVolume)
		.equal("siteId", siteId)
		.like("site.name", siteName, Site)
		.includeModel("site", Site, {
			attributes: ["id", "name"],
		})
		.findAndCountAll(Material);
	return res.sendSuccess(200, data);
};

export const getOne = async (req, res) => {
	const data = await Material.findByPk(req.params.id);
	if (!data) {
		res.sendError(404, "Material not found");
	}
	return res.sendSuccess(200, data);
};

export const create = async (req, res) => {
	await Material.create(req.body);
	res.sendSuccess(200, "Material created successfully");
};

export const update = async (req, res) => {
	const [updatedRows] = await Material.update(req.body, { where: { id: req.params.id } });
	if (updatedRows === 0) {
		return res.sendError(404, "Material not found");
	}
	return res.sendSuccess(200, "Material updated successfully");
};

export const destroy = async (req, res) => {
	const data = await Material.destroy({
		where: { id: req.params.id },
	});
	if (!data) {
		return res.sendError(404, "Material not found");
	}
	return res.sendSuccess(200, "Material deleted successfully");
};

export const restore = async (req, res) => {
	await Material.restore({ where: { id: req.params.id } });
	return res.sendSuccess(200, "Material restored successfully");
};

export const bulkCreate = async (req, res) => {
	const { transaction } = req;
	const materials = req.body;
	const { siteId: userSiteId } = req.user;

	if (!Array.isArray(materials) || materials.length === 0) {
		return res.sendError(400, "Request body must be a non-empty array of materials");
	}

	let materialData = [];

	if (userSiteId == null) {
		// 🔹 Admin user — needs siteName in body
		const siteNames = [
			...new Set(materials.map((z) => z.siteName?.trim()).filter(Boolean)),
		];

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

		materialData = materials.map((z) => ({
			siteId: siteMap.get(z.siteName),
			name: z.name?.trim(),
			description: z.description?.trim() || null,
			customerName: z.customerName?.trim() || null,
			UOM: z.uom?.trim() || null,
			netWeight: z.netWeight || null,
			netVolume: z.netVolume || null,
		}));
	} else {
		// 🔹 Normal user — use user's siteId
		materialData = materials.map((z) => ({
			siteId: userSiteId,
			name: z.name?.trim(),
			description: z.description?.trim() || null,
			customerName: z.customerName?.trim() || null,
			UOM: z.uom?.trim() || null,
			netWeight: z.netWeight || null,
			netVolume: z.netVolume || null,
		}));
	}

	console.log(materialData);

	// Remove invalid entries
	materialData = materialData.filter((z) => z.siteId && z.name);

	if (materialData.length === 0) {
		return res.sendError(400, "No valid materials to create.");
	}

	// 🔹 Bulk insert
	const createdMaterials = await Material.bulkCreate(materialData, {
		ignoreDuplicates: true,
		validate: true,
		transaction,
	});

	return res.sendSuccess(
		201,
		`${createdMaterials.length} materials created successfully.`,
	);
};
