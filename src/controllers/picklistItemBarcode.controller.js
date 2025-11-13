import { col, Op } from "sequelize";

import {
	FifoViolation,
	Inward,
	Material,
	Picklist,
	PicklistItem,
	PicklistItemBarcode,
} from "#src/index.js";

export const getAll = async (req, res) => {
	const { offset, limit, status, picklistId, picklistItemId, inwardId, barcode, shelf } =
		req.query;
	const data = await req.queryBuilder
		.status(status)
		.paginate(offset, limit)
		.equal("picklistItemId", picklistItemId)
		.equal("inwardId", inwardId)
		.equal("barcode", barcode)
		.equal("shelf", shelf)
		.equal("picklistItem.picklistId", picklistId, PicklistItem)
		.includeModel("picklistItem", PicklistItem, {
			attributes: ["picklistId", "materialName"],
		})
		.findAndCountAll(PicklistItemBarcode);
	return res.sendSuccess(200, data);
};

export const search = async (req, res) => {
	const { offset, limit, status, picklistId, picklistItemId, inwardId, barcode, shelf } =
		req.query;
	const data = await req.queryBuilder
		.status(status)
		.paginate(offset, limit)
		.equal("picklistItemId", picklistItemId)
		.equal("inwardId", inwardId)
		.like("barcode", barcode)
		.like("shelf", shelf)
		.equal("picklistItem.picklistId", picklistId, PicklistItem)
		.includeModel("picklistItem", PicklistItem, {
			attributes: ["picklistId", "materialName"],
		})
		.findAndCountAll(PicklistItemBarcode);
	return res.sendSuccess(200, data);
};

export const create = async (req, res) => {
	const { transaction } = req;
	const { barcode, picklistId, picklistItemId } = req.body;
	const { id: userId, username } = req.user;

	if (!barcode || !picklistId) {
		return res.sendError(400, "barcode and picklistId are required");
	}

	const inward = await Inward.findOne({ where: { barcode }, transaction });

	if (!inward) {
		return res.sendError(404, `Barcode ${barcode} not found`);
	}
	if (inward.auditStatus === "Scrapped") {
		return res.sendError(400, `Barcode ${barcode} is scrapped`);
	}
	if (!inward.inStock) {
		return res.sendError(400, `Barcode ${barcode} is out of stock`);
	}
	if (inward.qcStatus !== "Approved") {
		return res.sendError(400, `Barcode ${barcode} is not approved for picking`);
	}
	if (!inward.shelfId) {
		return res.sendError(400, `Barcode ${barcode} is not putaway yet`);
	}
	if (inward.isPicked) {
		return res.sendError(400, `Barcode ${barcode} is already picked`);
	}
	// 🔹 FIFO enforcement
	const inwardDateStart = new Date(inward.createdAt);
	inwardDateStart.setHours(0, 0, 0, 0);
	const olderInward = await Inward.findOne({
		where: {
			materialId: inward.materialId,
			siteId: inward.siteId,
			isPicked: false,
			qcStatus: "Approved",
			createdAt: { [Op.lt]: inwardDateStart },
		},
		order: [["createdAt", "ASC"]],
		transaction,
	});

	if (req.user.roleId != 1 && olderInward) {
		await FifoViolation.create({
			picklistId,
			type: "Violation",
			siteId: inward.siteId,
			barcode: inward.barcode,
			inwardId: inward.id,
			reason: `Tried to pick newer material (${inward.barcode}) before older batch (${olderInward.barcode})`,
			blockedByBarcode: olderInward.barcode,
			blockedByDate: olderInward.createdAt,
			transaction,
		});
		return res.sendError(
			400,
			`FIFO rule violated: older approved material (${olderInward.barcode}) from ${olderInward.createdAt.toLocaleString()} must be picked first.`,
		);
	}

	if (req.user.roleId === 1 && olderInward) {
		await FifoViolation.create({
			picklistId,
			type: "Override",
			siteId: inward.siteId,
			barcode: inward.barcode,
			inwardId: inward.id,
			reason: `Admin override: picked newer material (${inward.barcode}) before older batch (${olderInward.barcode})`,
			blockedByBarcode: olderInward.barcode,
			blockedByDate: olderInward.createdAt,
			transaction,
		});
	}

	let picklistItem;
	if (picklistItemId) {
		picklistItem = await PicklistItem.findByPk(picklistItemId, {
			include: [{ model: Picklist, as: "picklist" }],
			transaction,
		});
		if (!picklistItem) {
			return res.sendError(404, "Picklist item not found");
		}
	} else {
		picklistItem = await PicklistItem.findOne({
			where: { picklistId, materialId: inward.materialId },
			include: [{ model: Picklist, as: "picklist" }],
			transaction,
		});
	}

	if (!picklistItem || inward.materialId !== picklistItem.materialId) {
		return res.sendError(400, "Material cannot be picked in this picklist");
	}

	if (picklistItem.pickedQuantity == picklistItem.materialQuantity) {
		return res.sendError(400, "Cannot pick more than picklist material quantity.");
	}

	const [picklistItemBarcode, created] = await PicklistItemBarcode.findOrCreate({
		where: {
			picklistItemId: picklistItem.id,
			inwardId: inward.id,
		},
		defaults: {
			barcode: inward.barcode,
			quantity: inward.quantity,
			shelf: inward.shelfName || "N/A",
		},
		paranoid: false,
		transaction,
	});

	if (!created && picklistItemBarcode.deletedAt) {
		await picklistItemBarcode.restore({ transaction });
	}

	await Inward.update(
		{
			isPicked: true,
			pickerId: userId,
			picklistId: picklistItem.picklistId,
			picklistName: picklistItem.picklist?.name,
			pickedBy: username,
		},
		{ where: { id: inward.id }, transaction },
	);

	const updatedPickedQty = (picklistItem.pickedQuantity || 0) + inward.quantity;
	await PicklistItem.update(
		{ pickedQuantity: updatedPickedQty },
		{ where: { id: picklistItem.id }, transaction },
	);

	const pendingItems = await PicklistItem.count({
		where: {
			picklistId,
			pickedQuantity: { [Op.lt]: col("materialQuantity") },
		},
		transaction,
	});

	let picklistStatus;
	if (pendingItems === 0) picklistStatus = "Completed";
	else picklistStatus = "In Progress";

	return res.sendSuccess(201, { picklistStatus });
};

export const update = async (req, res) => {
	const { transaction } = req;
	const { id } = req.params;
	const { materialQuantity } = req.body;

	if (!id) {
		return res.sendError(400, "Picklist item ID is required");
	}

	if (materialQuantity === undefined || materialQuantity === null) {
		return res.sendError(400, "materialQuantity is required");
	}

	const picklistItem = await PicklistItem.findByPk(id, {
		include: [{ model: Material, as: "material" }],
		transaction,
	});

	if (!picklistItem) {
		return res.sendError(404, "Picklist item not found");
	}

	const material = await Material.findByPk(picklistItem.materialId, { transaction });
	if (!material) {
		return res.sendError(404, "Linked material not found");
	}

	if (materialQuantity > material.quantity) {
		return res.sendError(
			400,
			`Cannot pick more than stock quantity (${material.quantity})`,
		);
	}
	if (materialQuantity < picklistItem.pickedQuantity) {
		return res.sendError(
			400,
			`New quantity cannot be less than already picked (${picklistItem.pickedQuantity})`,
		);
	}
	const updatedItem = await PicklistItem.findByPk(id, { transaction });
	return res.sendSuccess(200, "Picklist item updated successfully", updatedItem);
};

export const destroy = async (req, res) => {
	const { transaction } = req;
	const { id } = req.params;
	if (!id) {
		return res.sendError(400, "PicklistItemBarcode ID is required");
	}
	const picklistItemBarcode = await PicklistItemBarcode.findByPk(id, {
		include: [
			{
				model: PicklistItem,
				as: "picklistItem",
				include: [{ model: Picklist, as: "picklist" }],
			},
			{ model: Inward, as: "inward" },
		],
		transaction,
	});

	if (!picklistItemBarcode) {
		return res.sendError(404, `PicklistItemBarcode ID ${id} not found`);
	}

	const { inward, picklistItem } = picklistItemBarcode;

	if (!inward || !picklistItem) {
		return res.sendError(400, "Invalid inward or picklist item link for this record");
	}

	await Inward.update(
		{
			isPicked: false,
			pickerId: null,
			picklistId: null,
			picklistName: null,
			pickedBy: null,
		},
		{ where: { id: inward.id }, transaction },
	);

	const newPickedQty = Math.max(
		(picklistItem.pickedQuantity || 0) - picklistItemBarcode.quantity,
		0,
	);

	await PicklistItem.update(
		{ pickedQuantity: newPickedQty },
		{ where: { id: picklistItem.id }, transaction },
	);

	await PicklistItemBarcode.destroy({
		where: { id: picklistItemBarcode.id },
		transaction,
	});

	return res.sendSuccess(200, "Picklist barcode deleted successfully");
};

export const bulkCreate = async (req, res) => {
	const { transaction } = req;
	const { barcodes, picklistId, picklistItemId } = req.body;
	const { id: userId, username } = req.user;

	if (!Array.isArray(barcodes) || barcodes.length === 0) {
		return res.sendError(400, "Barcodes array is required");
	}
	if (!picklistId) {
		return res.sendError(400, "picklistId is required");
	}

	const createdBarcodes = [];
	const skippedBarcodes = [];
	const restoredBarcodes = [];

	for (const barcode of barcodes) {
		try {
			const inward = await Inward.findOne({ where: { barcode }, transaction });
			if (!inward) {
				skippedBarcodes.push({ barcode, reason: "Barcode not found" });
				continue;
			}
			if (inward.auditStatus == "Scrapped") {
				return res.sendError(400, `Barcode ${barcode} is scrapped`);
			}
			if (!inward.inStock) {
				return res.sendError(400, `Barcode ${barcode} is out of stock`);
			}
			if (inward.qcStatus !== "Approved") {
				skippedBarcodes.push({ barcode, reason: "Barcode not approved" });
				continue;
			}
			if (!inward.shelfId) {
				return res.sendError(400, `Barcode ${barcode} is not putaway yet`);
			}
			if (inward.isPicked) {
				skippedBarcodes.push({ barcode, reason: "Barcode already picked" });
				continue;
			}

			// 🔹 FIFO enforcement
			const inwardDateStart = new Date(inward.createdAt);
			inwardDateStart.setHours(0, 0, 0, 0);
			const olderInward = await Inward.findOne({
				where: {
					materialId: inward.materialId,
					siteId: inward.siteId,
					isPicked: false,
					qcStatus: "Approved",
					createdAt: { [Op.lt]: inwardDateStart },
				},
				order: [["createdAt", "ASC"]],
				transaction,
			});

			if (req.user.roleId != 1 && olderInward) {
				await FifoViolation.create({
					picklistId,
					type: "Violation",
					siteId: inward.siteId,
					barcode: inward.barcode,
					inwardId: inward.id,
					reason: `Tried to pick newer material (${inward.barcode}) before older batch (${olderInward.barcode})`,
					blockedByBarcode: olderInward.barcode,
					blockedByDate: olderInward.createdAt,
					transaction,
				});
				return res.sendError(
					400,
					`FIFO rule violated: older approved material (${olderInward.barcode}) from ${olderInward.createdAt.toLocaleString()} must be picked first.`,
				);
			}

			if (req.user.roleId === 1 && olderInward) {
				await FifoViolation.create({
					picklistId,
					type: "Override",
					siteId: inward.siteId,
					barcode: inward.barcode,
					inwardId: inward.id,
					reason: `Admin override: picked newer material (${inward.barcode}) before older batch (${olderInward.barcode})`,
					blockedByBarcode: olderInward.barcode,
					blockedByDate: olderInward.createdAt,
					transaction,
				});
			}

			// ✅ Determine picklist item
			let picklistItem;
			if (picklistItemId) {
				picklistItem = await PicklistItem.findByPk(picklistItemId, {
					include: [{ model: Picklist, as: "picklist" }],
					transaction,
				});
			} else {
				picklistItem = await PicklistItem.findOne({
					where: { picklistId, materialId: inward.materialId },
					include: [{ model: Picklist, as: "picklist" }],
					transaction,
				});
			}

			if (!picklistItem) {
				skippedBarcodes.push({ barcode, reason: "Picklist item not found" });
				continue;
			}

			const currentPicked = picklistItem.pickedQuantity || 0;
			const newTotal = currentPicked + inward.quantity;

			if (newTotal > picklistItem.materialQuantity) {
				skippedBarcodes.push({
					barcode,
					reason: `Cannot pick more than picklist material quantity (Allowed: ${picklistItem.materialQuantity}, Current: ${currentPicked}, Trying to add: ${inward.quantity})`,
				});
				continue;
			}

			// ✅ findOrCreate + soft restore logic
			const [picklistItemBarcode, created] = await PicklistItemBarcode.findOrCreate({
				where: {
					picklistItemId: picklistItem.id,
					inwardId: inward.id,
				},
				defaults: {
					barcode: inward.barcode,
					quantity: inward.quantity,
					shelf: inward?.shelfName || "N/A",
				},
				paranoid: false,
				transaction,
			});

			if (!created && picklistItemBarcode.deletedAt) {
				await picklistItemBarcode.restore({ transaction });
				restoredBarcodes.push(barcode);
			} else if (created) {
				createdBarcodes.push(barcode);
			} else {
				skippedBarcodes.push({ barcode, reason: "Already exists in picklist" });
				continue;
			}

			// ✅ Update Inward
			await Inward.update(
				{
					isPicked: true,
					pickerId: userId,
					picklistId: picklistItem.picklistId,
					picklistName: picklistItem.picklist.name,
					pickedBy: username,
				},
				{ where: { id: inward.id }, transaction },
			);

			// ✅ Update PicklistItem quantity
			const updatedPickedQty = (picklistItem.pickedQuantity || 0) + inward.quantity;
			await PicklistItem.update(
				{ pickedQuantity: updatedPickedQty },
				{ where: { id: picklistItem.id }, transaction },
			);
		} catch (err) {
			skippedBarcodes.push({ barcode, reason: err.message });
		}
	}
	const pendingItems = await PicklistItem.count({
		where: {
			picklistId,
			pickedQuantity: { [Op.lt]: col("materialQuantity") },
		},
		transaction,
	});

	let picklistStatus;
	if (pendingItems === 0) picklistStatus = "Completed";
	else picklistStatus = "In Progress";

	return res.sendSuccess(201, {
		picklistStatus,
		created: createdBarcodes.length,
		restored: restoredBarcodes.length,
		skipped: skippedBarcodes.length,
		details: { createdBarcodes, restoredBarcodes, skippedBarcodes },
	});
};
