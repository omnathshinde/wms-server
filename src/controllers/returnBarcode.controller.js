import { Customer, Inward, Material, Picklist, ReturnBarcode } from "#src/index.js";

export const getAll = async (req, res) => {
	const {
		offset,
		limit,
		status,
		inwardId,
		barcode,
		materialName,
		materialDescription,
		dispatchAt,
		dispatchBy,
		picklistId,
		picklistName,
		pickedBy,
		lastShelfId,
		lastShelf,
	} = req.query;
	const data = await req.queryBuilder
		.site(req)
		.status(status)
		.paginate(offset, limit)
		.equal("inwardId", inwardId)
		.equal("barcode", barcode)
		.equal("materialName", materialName)
		.equal("materialDescription", materialDescription)
		.equal("dispatchAt", dispatchAt)
		.equal("dispatchBy", dispatchBy)
		.equal("picklistId", picklistId)
		.equal("picklistName", picklistName)
		.equal("pickedBy", pickedBy)
		.equal("lastShelfId", lastShelfId)
		.equal("lastShelf", lastShelf)
		.includeModel("picklist", Picklist, {
			attributes: ["id", "name"],
			include: [
				{
					model: Customer,
					as: "customer",
					attributes: ["id", "name"],
				},
			],
		})
		.findAndCountAll(ReturnBarcode);
	return res.sendSuccess(200, data);
};

export const search = async (req, res) => {
	const {
		offset,
		limit,
		status,
		inwardId,
		barcode,
		materialName,
		materialDescription,
		dispatchAt,
		dispatchBy,
		picklistId,
		picklistName,
		pickedBy,
		lastShelfId,
		lastShelf,
	} = req.query;
	const data = await req.queryBuilder
		.site(req)
		.status(status)
		.paginate(offset, limit)
		.equal("inwardId", inwardId)
		.like("barcode", barcode)
		.like("materialName", materialName)
		.like("materialDescription", materialDescription)
		.like("dispatchAt", dispatchAt)
		.like("dispatchBy", dispatchBy)
		.like("picklistId", picklistId)
		.like("picklistName", picklistName)
		.like("pickedBy", pickedBy)
		.equal("lastShelfId", lastShelfId)
		.like("lastShelf", lastShelf)
		.includeModel("picklist", Picklist, {
			attributes: ["id", "name"],
			include: [
				{
					model: Customer,
					as: "customer",
					attributes: ["id", "name"],
				},
			],
		})
		.findAndCountAll(ReturnBarcode);
	return res.sendSuccess(200, data);
};

export const getOne = async (req, res) => {
	const data = await Picklist.findByPk(req.params.id);
	if (!data) {
		res.sendError(404, "Picklist not found");
	}
	return res.sendSuccess(200, data);
};

export const create = async (req, res) => {
	const { transaction } = req;
	const items = req.body; // array of { siteName, barcode, materialName, materialDescription, remark }
	const user = req.user || { username: "System" };

	// ---------- VALIDATION ----------
	if (!Array.isArray(items) || items.length === 0) {
		return res.sendError(400, "Array of items is required");
	}

	// ---------- GET ALL BARCODES ----------
	const barcodes = items.map((i) => i.barcode);

	// ---------- FETCH INWARDS ----------
	const inwards = await Inward.findAll({
		where: { barcode: barcodes },
		raw: true,
		transaction,
	});

	if (inwards.length === 0) {
		return res.sendError(404, "No matching inward records found");
	}

	const validInwards = inwards.filter((i) => i.isDispatch == true && i.inStock == false);

	if (!validInwards.length) {
		return res.sendError(400, "No dispatched and out-of-stock barcodes found");
	}

	const inwardMap = new Map(validInwards.map((i) => [i.barcode, i]));
	const success = [];
	const skipped = [];
	const errors = [];

	for (const row of items) {
		const inward = inwardMap.get(row.barcode);

		if (!inward) {
			skipped.push({
				barcode: row.barcode,
				message: "Inward not found",
			});
			continue;
		}

		try {
			const today = new Date();
			const rawMaterial = await Material.findByPk(inward.materialId, { transaction });
			const material = rawMaterial.get({ plain: true });

			// ---------- Create ReturnBarcode ----------
			await ReturnBarcode.create(
				{
					siteId: inward?.siteId,
					remark: row.remark || "",
					inwardId: inward.id,
					barcode: inward?.barcode,
					quantity: inward?.quantity,
					materialName: material?.name,
					materialDescription: material?.description,
					inwardDate: inward?.createdAt,
					picklistId: inward?.picklistId || null,
					picklistName: inward?.picklistName || "N/A",
					pickedBy: inward?.pickedBy || "N/A",
					dispatchAt: (inward?.dispatchAt || today).toISOString(),
					dispatchBy: inward?.dispatchBy || "N/A",
					lastShelfId: inward?.shelfId || null,
					lastShelf: inward?.shelfName || "N/A",
				},
				{ transaction },
			);

			await Material.update(
				{ quantity: material.quantity + inward.quantity },
				{ where: { id: material.id }, transaction },
			);

			// ---------- Update Inward ----------
			await Inward.update(
				{
					qcStatus: "Pending",
					qcRemark: null,
					shelfId: null,
					shelfName: null,
					isPutAway: false,
					recommandedShelf: inward?.shelfName || "N/A",
					isPicked: false,
					pickerId: null,
					picklistId: null,
					picklistName: null,
					pickedBy: null,
					isDispatch: false,
					dispatchAt: null,
					dispatchBy: null,
					isReturn: true,
					returnAt: today,
					returnBy: user.username,
					inStock: true,
				},
				{ where: { id: inward.id }, transaction },
			);

			success.push(row.barcode);
		} catch (err) {
			console.error("Return error for barcode:", row.barcode, err);
			errors.push({ barcode: row.barcode, message: err.message });
		}
	}

	return res.sendSuccess(201, {
		message: "Return process completed",
		summary: {
			total: items.length,
			success: success.length,
			skipped: skipped.length,
			errors: errors.length,
		},
		details: { success, skipped, errors },
	});
};
