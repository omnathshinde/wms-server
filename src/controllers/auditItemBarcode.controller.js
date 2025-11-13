import { literal, Op } from "sequelize";

import { Audit, AuditItem, AuditItemBarcode, Inward } from "#src/index.js";

export const getAll = async (req, res) => {
	const { offset, limit, status, auditId, auditItemId, inwardId, barcode, shelf } =
		req.query;
	const data = await req.queryBuilder
		.status(status)
		.paginate(offset, limit)
		.equal("auditItemId", auditItemId)
		.equal("inwardId", inwardId)
		.equal("barcode", barcode)
		.equal("shelf", shelf)
		.orderBy("barcodeStatus", "ASC")
		.equal("auditItem.auditId", auditId, AuditItem)
		.includeModel("auditItem", AuditItem, {
			attributes: ["auditId", "materialName"],
		})
		.findAndCountAll(AuditItemBarcode);
	return res.sendSuccess(200, data);
};

export const search = async (req, res) => {
	const { offset, limit, status, auditId, auditItemId, inwardId, barcode, shelf } =
		req.query;
	const data = await req.queryBuilder
		.status(status)
		.paginate(offset, limit)
		.equal("auditItemId", auditItemId)
		.equal("inwardId", inwardId)
		.like("barcode", barcode)
		.like("shelf", shelf)
		.orderBy("barcodeStatus", "DESC")
		.equal("auditItem.auditId", auditId, AuditItem)
		.includeModel("auditItem", AuditItem, {
			attributes: ["auditId", "materialName"],
		})
		.findAndCountAll(AuditItemBarcode);
	return res.sendSuccess(200, data);
};

export const update = async (req, res) => {
	const { transaction } = req;
	const { username } = req.user;
	const { auditId, barcodes, auditStatus, remark } = req.body;
	const today = new Date();

	// ---------- VALIDATION ----------
	if (!auditId || !Array.isArray(barcodes) || barcodes.length === 0) {
		return res.sendError(400, "auditId and barcodes array are required");
	}

	if (!auditStatus) {
		return res.sendError(
			400,
			"auditStatus is required (Found, Scrapped, Manually Approved)",
		);
	}

	const validStatuses = ["Found", "Scrapped", "Manually Approved"];
	if (!validStatuses.includes(auditStatus)) {
		return res.sendError(
			400,
			`Invalid auditStatus. Must be one of: ${validStatuses.join(", ")}`,
		);
	}

	// ---------- STEP 1: Fetch in bulk ----------
	const inwards = await Inward.findAll({
		where: { barcode: { [Op.in]: barcodes } },
		transaction,
	});

	const audit = await Audit.findByPk(auditId, { raw: true });
	console.log(audit);

	if (!audit) {
		return res.sendError(404, "Audit not found");
	}
	if (audit?.auditStatus == "Completed")
		return res.sendError(400, "Audit already completed");

	const auditBarcodes = await AuditItemBarcode.findAll({
		where: { barcode: { [Op.in]: barcodes } },
		include: [
			{
				model: AuditItem,
				as: "auditItem",
				where: { auditId },
				attributes: ["id"],
			},
		],
		transaction,
	});

	const inwardMap = new Map(inwards.map((i) => [i.barcode, i]));
	const auditBarcodeMap = new Map(auditBarcodes.map((b) => [b.barcode, b]));

	const success = [];
	const notFound = [];

	// ---------- STEP 2: Process each barcode ----------
	for (const barcode of barcodes) {
		const inward = inwardMap.get(barcode);
		const auditBarcode = auditBarcodeMap.get(barcode);

		if (!inward || !auditBarcode) {
			notFound.push(barcode);
			continue;
		}

		// skipp already found barcode
		if (auditBarcode.barcodeStatus === "Found") {
			continue;
		}

		// Update AuditItemBarcode
		await AuditItemBarcode.update(
			{
				barcodeStatus: auditStatus,
			},
			{
				where: { id: auditBarcode.id },
				transaction,
			},
		);

		// Update Inward record
		await Inward.update(
			{
				auditStatus,
				auditRemark: remark || null,
				auditAt: today,
				auditBy: username,
				inStock: auditStatus == "Scrapped" ? false : true,
			},
			{
				where: { barcode: auditBarcode.barcode },
				transaction,
			},
			{ transaction },
		);

		success.push({ barcode, auditItemId: auditBarcode.auditItemId });
	}

	// ---------- STEP 3: Group by AuditItem for quantity updates ----------
	const grouped = new Map(); // auditItemId → count
	for (const { auditItemId } of success) {
		grouped.set(auditItemId, (grouped.get(auditItemId) || 0) + 1);
	}

	// Build quantity updates based on status
	for (const [auditItemId, count] of grouped.entries()) {
		let updateFields = {};

		if (auditStatus === "Found") {
			updateFields = {
				foundQuantity: literal(`foundQuantity + ${count}`),
				notFoundQuantity: literal(`GREATEST(notFoundQuantity - ${count}, 0)`),
			};
		} else if (auditStatus === "Scrapped") {
			updateFields = {
				scrappedQuantity: literal(`scrappedQuantity + ${count}`),
				notFoundQuantity: literal(`GREATEST(notFoundQuantity - ${count}, 0)`),
			};
		} else if (auditStatus === "Manually Approved") {
			updateFields = {
				manuallyApprovedQuantity: literal(`manuallyApprovedQuantity + ${count}`),
				notFoundQuantity: literal(`GREATEST(notFoundQuantity - ${count}, 0)`),
			};
		}
		console.log(updateFields);

		await AuditItem.update(updateFields, {
			where: { id: auditItemId },
			transaction,
		});
	}

	// ---------- STEP 4: Response ----------
	return res.sendSuccess(200, {
		message: `'${success.length}' barcode audited`,
		total: barcodes.length,
		updated: success.length,
		notFound: notFound.length,
	});
};
