import { col, Op } from "sequelize";

import {
	FifoViolation,
	Inward,
	Picklist,
	PicklistItem,
	PicklistItemBarcode,
} from "#src/models/index.js";

export const getPicklistItemStatus = (pickedQuantity, materialQuantity) => {
	if (pickedQuantity <= 0) return "Pending";
	if (pickedQuantity === materialQuantity) return "Completed";
	return "In Progress";
};

export const validateInwardForPicking = (inward) => {
	if (!inward) throw new Error("Barcode not found");

	if (inward.auditStatus === "Scrapped") {
		throw new Error(`Barcode ${inward.barcode} is scrapped`);
	}

	if (!inward.inStock) {
		throw new Error(`Barcode ${inward.barcode} is out of stock`);
	}

	if (inward.qcStatus !== "Approved") {
		throw new Error(`Barcode ${inward.barcode} is not approved`);
	}

	if (!inward.shelfId) {
		throw new Error(`Barcode ${inward.barcode} is not putaway yet`);
	}

	if (inward.isPicked) {
		throw new Error(`Barcode ${inward.barcode} is already picked`);
	}
};

export const getPicklistItem = async (
	picklistId,
	picklistItemId,
	materialId,
	transaction,
) => {
	if (picklistItemId) {
		return PicklistItem.findByPk(picklistItemId, {
			include: [{ model: Picklist, as: "picklist" }],
			transaction,
		});
	}

	return PicklistItem.findOne({
		where: {
			picklistId,
			materialId,
		},
		include: [{ model: Picklist, as: "picklist" }],
		transaction,
	});
};

export const updatePicklistItemQuantity = async (
	picklistItem,
	quantityChange,
	transaction,
) => {
	const pickedQuantity = Math.max(
		(picklistItem.pickedQuantity || 0) + quantityChange,
		0,
	);

	const picklistItemStatus = getPicklistItemStatus(
		pickedQuantity,
		picklistItem.materialQuantity,
	);

	await PicklistItem.update(
		{
			pickedQuantity,
			picklistItemStatus,
		},
		{
			where: { id: picklistItem.id },
			transaction,
		},
	);

	return {
		pickedQuantity,
		picklistItemStatus,
	};
};

export const updateInwardPickStatus = async (inwardId, data, transaction) => {
	await Inward.update(data, {
		where: { id: inwardId },
		transaction,
	});
};

export const getPicklistStatus = async (picklistId, transaction) => {
	const pendingItems = await PicklistItem.count({
		where: {
			picklistId,
			pickedQuantity: {
				[Op.lt]: col("materialQuantity"),
			},
		},
		transaction,
	});

	return pendingItems === 0 ? "Completed" : "In Progress";
};

export const createOrRestorePicklistBarcode = async (
	picklistItem,
	inward,
	transaction,
) => {
	const [record, created] = await PicklistItemBarcode.findOrCreate({
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

	if (!created && record.deletedAt) {
		await record.restore({ transaction });
	}

	return {
		record,
		created,
		restored: !!record.deletedAt,
	};
};

export const validateFifo = async (inward, picklistId, user, transaction) => {
	const inwardDateStart = new Date(inward.createdAt);

	inwardDateStart.setHours(0, 0, 0, 0);

	const olderInward = await Inward.findOne({
		where: {
			materialId: inward.materialId,
			siteId: inward.siteId,
			isPicked: false,
			qcStatus: "Approved",
			createdAt: {
				[Op.lt]: inwardDateStart,
			},
		},
		order: [["createdAt", "ASC"]],
		transaction,
	});

	if (!olderInward) {
		return;
	}

	if (user.roleId !== 1) {
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

		throw new Error(
			`FIFO rule violated: older approved material (${olderInward.barcode}) must be picked first.`,
		);
	}

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
};
