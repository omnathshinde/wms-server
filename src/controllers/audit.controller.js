import { Op } from "sequelize";

import { Audit, AuditItem, AuditItemBarcode, Inward, Material } from "#src/index.js";

export const getAll = async (req, res) => {
	const { offset, limit, name, status, auditStatus } = req.query;
	const options = req.queryBuilder
		.paginate(offset, limit)
		.equal("name", name)
		.equal("auditStatus", auditStatus)
		.status(status)
		.toQueryOptions();
	const data = await Audit.findAndCountAll(options);
	return res.sendSuccess(200, data);
};

export const search = async (req, res) => {
	const { offset, limit, name, status, auditStatus } = req.query;
	const options = req.queryBuilder
		.paginate(offset, limit)
		.like("name", name)
		.like("auditStatus", auditStatus)
		.status(status)
		.toQueryOptions();
	const data = await Audit.findAndCountAll(options);
	return res.sendSuccess(200, data);
};

export const getOne = async (req, res) => {
	const data = await Audit.findByPk(req.params.id);
	if (!data) {
		res.sendError(404, "Audit not found");
	}
	return res.sendSuccess(200, data);
};

export const create = async (req, res) => {
	const { transaction } = req;
	const { siteId, materialId } = req.body;
	if (!siteId) {
		return res.sendError(400, "siteId is required");
	}
	const number = `AUD-${Date.now()}`;
	const audit = await Audit.create(
		{
			siteId,
			number,
			auditStatus: "Pending",
		},
		{ transaction },
	);

	const materialWhere = {
		siteId,
		quantity: { [Op.gt]: 0 },
	};
	if (materialId) materialWhere.id = materialId;

	const materials = await Material.findAll({
		where: materialWhere,
		transaction,
	});

	if (!materials.length) {
		return res.sendError(404, "No materials found with available stock");
	}

	// --- Pre-fetch all inwards (batch query instead of inside loop) ---
	const materialIds = materials.map((m) => m.id);
	const inwards = await Inward.findAll({
		where: {
			siteId,
			materialId: { [Op.in]: materialIds },
			inStock: true,
		},
		transaction,
	});

	// Group inwards by materialId for faster lookup
	const inwardMap = inwards.reduce((map, inward) => {
		if (!map[inward.materialId]) map[inward.materialId] = [];
		map[inward.materialId].push(inward);
		return map;
	}, {});

	for (const material of materials) {
		const auditItem = await AuditItem.create(
			{
				auditId: audit.id,
				materialId: material.id,
				materialName: material.name,
				materialDescription: material.description,
				availableQuantity: material.quantity,
				notFoundQuantity: material.quantity,
			},
			{ transaction },
		);

		const inwardList = inwardMap[material.id] || [];

		if (inwardList.length) {
			const barcodeData = inwardList.map((inward) => ({
				auditItemId: auditItem.id,
				inwardId: inward.id,
				barcode: inward.barcode,
				quantity: inward.quantity,
				materialName: material.name,
				materialDescription: material.description,
				shelf: inward.shelfName || "N/A",
			}));

			// Bulk create for efficiency
			await AuditItemBarcode.bulkCreate(barcodeData, { transaction });
		}
	}

	// --- Return response ---
	return res.sendSuccess(200, {
		message: "Audit created successfully",
	});
};

export const update = async (req, res) => {
	const { auditStatus } = req.body;
	const { username } = req.user;
	const today = new Date();

	if (auditStatus == "In Progress") {
		req.body.startAt = today.toISOString();
		req.body.startBy = username;
	}

	if (auditStatus == "Reconcile") {
		req.body.endAt = today.toISOString();
		req.body.endBy = username;
	}

	const [updatedRows] = await Audit.update(req.body, { where: { id: req.params.id } });
	if (updatedRows === 0) {
		return res.sendError(404, "Audit not found");
	}
	return res.sendSuccess(200, "Audit updated successfully");
};
