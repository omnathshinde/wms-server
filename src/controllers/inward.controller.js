import { literal, Op } from "sequelize";

import { Inward, Material, Site } from "#src/index.js";
import inwardQuery from "#src/utils/inwardQuery.js";

export const getAll = async (req, res) => {
	const data = await inwardQuery(req, false);
	return res.sendSuccess(200, data);
};

export const search = async (req, res) => {
	const data = await inwardQuery(req, true);
	return res.sendSuccess(200, data);
};

export const getOne = async (req, res) => {
	const options = req.queryBuilder
		.includeModel("site", Site, {
			attributes: ["id", "name"],
		})
		.toQueryOptions();
	const data = await Inward.findByPk(req.params.id, options);
	if (!data) {
		res.sendError(404, "Inward not found");
	}
	return res.sendSuccess(200, data);
};

export const create = async (req, res) => {
	const { transaction } = req;
	let {
		siteId,
		materialId,
		materialName,
		materialDescription,
		batch = "N/A",
		invoice,
		manufacturingDate,
		inwardQuantity,
		shelfName,
	} = req.body;

	// ---------------- VALIDATION ----------------
	if (!siteId) {
		return res.sendError(400, "Please select site ");
	}
	if (!invoice || !manufacturingDate || !inwardQuantity) {
		return res.sendError(
			400,
			"Invoice, manufacturing date, and inward quantity are required",
		);
	}
	if (!materialId) return res.sendError(400, "Material field is required");

	if (!inwardQuantity || isNaN(inwardQuantity) || inwardQuantity <= 0)
		return res.sendError(400, "Inward quantity must be positive");

	// ---------------- MATERIAL DETAILS ----------------
	if (!materialName || !materialDescription) {
		const material = await Material.findByPk(materialId, { transaction });
		if (!material) return res.sendError(404, "Material not found");
		const materialData = material.get({ plain: true });
		materialName = materialData.name || "Unknown Material";
		materialDescription = materialData.description || "N/A";
	}

	// ---------------- LAST BARCODE ----------------
	const lastBarcodeRecord = await Inward.findOne({
		order: [["id", "DESC"]],
		transaction,
		paranoid: false,
	});
	let lastBarcodeNumber = lastBarcodeRecord
		? parseInt(lastBarcodeRecord.barcode, 10)
		: 1111111110;

	// ---------------- BUILD NEW ENTRIES ----------------
	const inwardEntries = [];
	for (let i = 0; i < inwardQuantity; i++) {
		lastBarcodeNumber += 1;
		const barcode = String(lastBarcodeNumber).padStart(10, "0");

		inwardEntries.push({
			siteId,
			barcode,
			autoSerial: true,
			quantity: 1,
			materialId,
			materialName,
			materialDescription,
			batch,
			invoice,
			manufacturingDate,
			qcStatus: "Approved",
			recommandedShelf: shelfName || null,
		});
	}
	console.log(inwardEntries);

	// ---------------- SAVE ----------------
	await Inward.bulkCreate(inwardEntries, {
		transaction,
		ignoreDuplicates: true,
		validate: true,
	});

	// ---------------- COUNT ACTUALLY CREATED ----------------
	const barcodes = inwardEntries.map((e) => e.barcode);
	const createdCount = await Inward.count({
		where: { barcode: { [Op.in]: barcodes } },
		transaction,
	});

	// ---------------- UPDATE INVENTORY ----------------
	const inventory = await Material.findOne({
		where: { id: materialId },
		transaction,
	});
	if (!inventory) return res.sendError(404, "Inventory not found");

	await inventory.update(
		{ quantity: literal(`quantity + ${createdCount}`) },
		{ transaction },
	);

	// ---------------- SUCCESS ----------------
	return res.sendSuccess(201, `${createdCount} Inwards created successfully`);
};

export const update = async (req, res) => {
	const [updatedRows] = await Inward.update(req.body, { where: { id: req.params.id } });
	if (updatedRows === 0) {
		return res.sendError(404, "Inward not found");
	}
	return res.sendSuccess(200, "Inward updated successfully");
};

export const destroy = async (req, res) => {
	const data = await Inward.destroy({
		where: { id: req.params.id },
	});
	if (!data) {
		return res.sendError(404, "Inward not found");
	}
	return res.sendSuccess(200, "Inward deleted successfully");
};

export const restore = async (req, res) => {
	const data = await Inward.restore({ where: { id: req.params.id } });
	if (!data) {
		return res.sendError(404, "Inward not found");
	}
	return res.sendSuccess(200, "Inward restored successfully");
};

export const bulkCreate = async (req, res) => {
	const { transaction } = req;
	const inwards = req.body;
	let siteId = req.user?.siteId || null;
	// ---------- Basic Validation ----------
	if (!Array.isArray(inwards) || inwards.length === 0)
		return res.sendError(400, "Inward list must be a non-empty array");

	// ---------- 2️⃣ Strict Field Validation ----------
	const requiredFields = [
		"barcode",
		"materialName",
		"materialDescription",
		"batch",
		"invoice",
		"manufacturingDate",
	];
	if (!siteId) requiredFields.push("site");

	for (const [index, item] of inwards.entries()) {
		for (const field of requiredFields) {
			if (!item[field] || item[field].toString().trim() === "") {
				return res.sendError(
					400,
					`Record ${index + 1}: '${field}' is required and cannot be empty`,
				);
			}
		}
	}

	// ---------- Collect unique names ----------
	const materialNames = [
		...new Set(inwards.map((i) => i.materialName?.trim()).filter(Boolean)),
	];

	const siteNames =
		siteId === null
			? [...new Set(inwards.map((i) => i.site?.trim()).filter(Boolean))]
			: [];

	const barcodes = inwards.map((i) => i.barcode.trim());

	// ---------- Prevent duplicate barcodes ----------
	const existing = await Inward.findAll({
		where: { barcode: { [Op.in]: barcodes } },
		attributes: ["barcode"],
		transaction,
	});

	if (existing.length > 0) {
		const duplicateCodes = existing.map((e) => e.barcode);
		return res.sendError(400, `Duplicate barcodes found: ${duplicateCodes.join(", ")}`);
	}

	// ---------- Load reference data ----------
	const [sites, materials] = await Promise.all([
		siteId ? [] : Site.findAll({ where: { name: { [Op.in]: siteNames } }, transaction }),
		Material.findAll({
			where: { name: { [Op.in]: materialNames } },
			attributes: ["id", "name", "siteId", "description"],
			transaction,
		}),
	]);

	const siteMap = new Map(sites.map((s) => [s.name, s.id]));

	const materialMap = new Map(
		materials.map((m) => [
			m.name,
			{ id: m.id, siteId: m.siteId, description: m.description },
		]),
	);

	// ---------- Enrich + Validate Records ----------
	const validEntries = [];
	for (const [index, item] of inwards.entries()) {
		const material = materialMap.get(item.materialName);
		const materialId = material?.id ?? null;
		const materialSiteId = material?.siteId ?? null;

		let finalSiteId = siteMap.get(item.site) || siteId;

		// 🔹 Validate site existence
		if (!finalSiteId) {
			return res.sendError(
				400,
				`Record ${index + 1}: Site '${item.site}' not found for barcode ${item.barcode}`,
			);
		}

		// 🔹 Validate material existence
		if (!materialId) {
			return res.sendError(
				400,
				`Record ${index + 1}: Material '${item.materialName}' not found`,
			);
		}

		// 🔹 Validate material-site mapping
		if (materialSiteId && materialSiteId !== finalSiteId) {
			return res.sendError(
				400,
				`Record ${index + 1}: Material '${item.materialName}' belongs to a different site`,
			);
		}

		validEntries.push({
			barcode: item.barcode.trim(),
			autoSerial: false,
			siteId: finalSiteId,
			materialId,
			materialName: item.materialName,
			materialDescription: material.description || "N/A",
			batch: item.batch || "N/A",
			invoice: item.invoice || "N/A",
			mrp: item.mrp || null,
			manufacturingDate: item.manufacturingDate || new Date(),
			quantity: 1,
			qcStatus: "Approved",
			recommandedShelf: item.shelfName || null,
		});
	}

	if (validEntries.length === 0) return res.sendError(400, "No valid records to insert");

	// ---------- Insert ----------
	await Inward.bulkCreate(validEntries, {
		transaction,
		ignoreDuplicates: true,
	});

	// ---------- Update inventory ----------
	for (const entry of validEntries) {
		await Material.update(
			{ quantity: literal(`quantity + ${entry.quantity}`) },
			{ where: { id: entry.materialId }, transaction },
		);
	}

	// ---------- ✅ Success ----------
	return res.sendSuccess(201, `${validEntries.length} inwards created successfully`);
};

export const generateBarcodes = async (req, res) => {
	const { transaction } = req;
	const inwards = req.body;
	let userSiteId = req.user?.siteId || null;

	// ---------- 1️⃣ Validate Input ----------
	if (!Array.isArray(inwards) || inwards.length === 0) {
		return res.sendError(400, "Request body must be a non-empty array");
	}

	// ---------- 2️⃣ Gather unique lookups ----------
	const siteNames = [...new Set(inwards.map((i) => i.site?.trim()).filter(Boolean))];
	const materialNames = [
		...new Set(inwards.map((i) => i.materialName?.trim()).filter(Boolean)),
	];

	// ---------- 3️⃣ Load reference data ----------
	const [sites, materials] = await Promise.all([
		userSiteId
			? []
			: Site.findAll({ where: { name: { [Op.in]: siteNames } }, transaction }),
		Material.findAll({ where: { name: { [Op.in]: materialNames } }, transaction }),
	]);

	const siteMap = new Map(sites.map((s) => [s.name, s.id]));
	const materialMap = new Map(
		materials.map((m) => [
			m.name,
			{ id: m.id, siteId: m.siteId, description: m.description },
		]),
	);

	// ---------- 4️⃣ Get starting barcode ----------
	const lastBarcodeRecord = await Inward.findOne({
		order: [["id", "DESC"]],
		transaction,
		paranoid: false,
	});
	let nextBarcode = Number(lastBarcodeRecord?.barcode);
	if (isNaN(nextBarcode) || !nextBarcode) nextBarcode = 1111111110;
	const validEntries = [];

	// ---------- 5️⃣ Build records ----------
	for (const [index, item] of inwards.entries()) {
		// Determine siteId
		const siteId = userSiteId || siteMap.get(item.site);
		if (!siteId)
			return res.sendError(400, `Record ${index + 1}: Invalid or missing site`);

		// Material check
		const material = materialMap.get(item.materialName);
		if (!material)
			return res.sendError(
				400,
				`Record ${index + 1}: Material '${item.materialName}' not found`,
			);
		if (material.siteId && material.siteId !== siteId)
			return res.sendError(
				400,
				`Record ${index + 1}: Material '${item.materialName}' belongs to another site`,
			);

		const materialId = material.id;

		// Barcode generation loop
		const inwardQuantity = Number(item.inwardQuantity ?? 1);
		for (let i = 0; i < inwardQuantity; i++) {
			nextBarcode += 1;
			const barcode = String(nextBarcode).padStart(10, "0");

			validEntries.push({
				barcode,
				autoSerial: true,
				siteId,
				materialId,
				materialName: item.materialName,
				materialDescription: material.description,
				batch: item.batch || "N/A",
				invoice: item.invoice || "N/A",
				mrp: item.mrp || null,
				manufacturingDate: item.manufacturingDate || new Date(),
				quantity: 1,
				qcStatus: "Approved",
				recommandedShelf: item.shelfName || null,
			});
		}
	}

	if (!validEntries.length)
		return res.sendError(400, "No valid inward records to insert");

	// ---------- 6️⃣ Bulk Insert ----------
	await Inward.bulkCreate(validEntries, { transaction, ignoreDuplicates: true });

	// ---------- 7️⃣ Inventory Update ----------
	const byMaterial = new Map();

	for (const e of validEntries) {
		byMaterial.set(e.materialId, (byMaterial.get(e.materialId) || 0) + e.quantity);
	}

	for (const [mid, qty] of byMaterial.entries()) {
		await Material.update(
			{ quantity: literal(`quantity + ${qty}`) },
			{ where: { id: mid }, transaction },
		);
	}

	// ---------- ✅ Done ----------
	return res.sendSuccess(201, `${validEntries.length} inwards created successfully`, {
		total: validEntries.length,
		firstBarcode: validEntries[0]?.barcode,
		lastBarcode: validEntries.at(-1)?.barcode,
	});
};
