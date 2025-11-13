import { Inward, Putaway, Shelf } from "#src/index.js";

export const getAll = async (req, res) => {
	const {
		offset,
		limit,
		status,
		inwardId,
		currentShelfId,
		previousShelfId,
		currentShelf,
		previousShelf,
	} = req.query;
	const data = await req.queryBuilder
		.status(status)
		.paginate(offset, limit)
		.equal("inwardId", inwardId)
		.equal("currentShelfId", currentShelfId)
		.equal("previousShelfId", previousShelfId)
		.equal("currentShelf", currentShelf)
		.equal("previousShelf", previousShelf)
		.findAndCountAll(Putaway);
	return res.sendSuccess(200, data);
};

export const search = async (req, res) => {
	const {
		offset,
		limit,
		status,
		inwardId,
		currentShelfId,
		previousShelfId,
		currentShelf,
		previousShelf,
	} = req.query;
	const data = await req.queryBuilder
		.status(status)
		.paginate(offset, limit)
		.equal("inwardId", inwardId)
		.equal("currentShelfId", currentShelfId)
		.equal("previousShelfId", previousShelfId)
		.like("currentShelf", currentShelf)
		.like("previousShelf", previousShelf)
		.findAndCountAll(Putaway);
	return res.sendSuccess(200, data);
};

export const getOne = async (req, res) => {
	const data = await Putaway.findByPk(req.params.id);
	if (!data) {
		res.sendError(404, "Putaway transaction not found");
	}
	return res.sendSuccess(200, data);
};

export const create = async (req, res) => {
	const { transaction } = req;
	const { inwardId, barcode, shelfId, shelfName } = req.body;

	// ---------- VALIDATION ----------
	if ((!inwardId && !barcode) || !shelfId || !shelfName)
		return res.sendError(400, "Inward barcode and shelfName are required");

	// ---------- FIND INWARD ----------
	const inward = await Inward.findOne({
		where: inwardId ? { id: inwardId } : { barcode },
		transaction,
	});

	if (!inward) return res.sendError(404, "Inward record not found");

	// ---------- CHECK QC IS APPROVED  ----------
	if (inward.qcStatus === "Rejected")
		return res.sendError(404, "QC is rejected, you cannot putaway");
	if (inward.qcStatus !== "Approved") return res.sendError(404, "QC is not approved yet");
	if (inward.shelfId === shelfId && inward.isPutAway)
		return res.sendError(400, "Material is already putaway at the selected location.");

	const shelf = await Shelf.findByPk(shelfId, { transaction });
	if (!shelf) {
		return res.sendError(404, `Shelf '${shelfName}' not found.`);
	}
	const quantity = inward.quantity ?? 0;

	const totalCapacity = shelf.capacity ?? 0;
	const usedCapacity = shelf.loadedCapacity ?? 0;
	const available = totalCapacity - usedCapacity;

	if (available < quantity) {
		return res.sendError(
			400,
			`Shelf '${shelfName}' has insufficient capacity. Available: ${available}, Required: ${quantity}.`,
		);
	}

	// ---------- TRACK CURRENT & PREVIOUS SHELF ----------
	const previousShelfId = inward.shelfId || null;
	const previousShelf = inward.shelfName || null;

	const currentShelfId = shelfId;
	const currentShelf = shelfName;

	// ---------- CREATE PUTAWAY RECORD ----------
	await Putaway.create(
		{
			inwardId: inward.id,
			currentShelfId,
			currentShelf,
			previousShelfId,
			previousShelf,
		},
		{ transaction },
	);

	// ---------- UPDATE INWARD ----------
	await Inward.update(
		{
			shelfId,
			shelfName,
			isPutAway: true,
		},
		{
			where: { id: inward.id },
			transaction,
		},
	);

	return res.sendSuccess(200, "Putaway transaction completed successfully");
};

export const bulkCreate = async (req, res) => {
	const { transaction } = req;
	const { barcodes, shelfId, shelfName } = req.body;

	// ---------- VALIDATION ----------
	if (!Array.isArray(barcodes) || barcodes.length === 0) {
		return res.sendError(400, "barcodes array is required");
	}
	if (!shelfId || !shelfName) {
		return res.sendError(400, "shelfId and shelfName are required");
	}

	// ---------- FETCH ALL INWARD RECORDS ----------
	const inwards = await Inward.findAll({
		where: { barcode: barcodes },
		transaction,
	});

	if (!inwards.length) {
		return res.sendError(404, "No matching inwards found for provided barcodes");
	}

	// Map barcodes found for quick access
	const inwardMap = new Map(inwards.map((i) => [i.barcode, i]));

	const success = [];
	const skipped = [];
	const errors = [];

	// ---------- PROCESS EACH BARCODE ----------
	for (const barcode of barcodes) {
		try {
			const inward = inwardMap.get(barcode);

			if (!inward) {
				skipped.push({ barcode, reason: "Not found" });
				continue;
			}

			// QC validation
			if (inward.qcStatus === "Rejected") {
				skipped.push({ barcode, reason: "QC rejected" });
				continue;
			}
			if (inward.qcStatus !== "Approved") {
				skipped.push({ barcode, reason: "QC not approved yet" });
				continue;
			}

			const previousShelfId = inward.shelfId || null;
			const previousShelf = inward.shelfName || null;

			if (previousShelfId == shelfId) {
				skipped.push({ barcode, reason: "Can put on same location again" });
				continue;
			}

			// ---------- CREATE PUTAWAY ----------
			await Putaway.create(
				{
					inwardId: inward.id,
					currentShelfId: shelfId,
					currentShelf: shelfName,
					previousShelfId,
					previousShelf,
				},
				{ transaction },
			);

			// ---------- UPDATE INWARD ----------
			await Inward.update(
				{
					shelfId,
					shelfName,
					isPutAway: true,
				},
				{ where: { id: inward.id }, transaction },
			);

			success.push(barcode);
		} catch (err) {
			errors.push({ barcode, reason: err.message });
		}
	}

	// ---------- SUMMARY RESPONSE ----------
	return res.sendSuccess(200, "Bulk putaway processed", {
		total: barcodes.length,
		successCount: success.length,
		skippedCount: skipped.length,
		errorCount: errors.length,
		success,
		skipped,
		errors,
	});
};
