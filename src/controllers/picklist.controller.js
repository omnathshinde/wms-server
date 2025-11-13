import { literal } from "sequelize";

import {
	Customer,
	Inward,
	Material,
	Picklist,
	PicklistItem,
	PicklistItemBarcode,
	User,
} from "#src/index.js";

export const getAll = async (req, res) => {
	const {
		offset,
		limit,
		status,
		userId,
		customerId,
		customerName,
		name,
		picklistStatus,
		isIssued,
	} = req.query;
	const data = await req.queryBuilder
		.site(req)
		.status(status)
		.paginate(offset, limit)
		.equal("userId", userId)
		.equal("customerId", customerId)
		.equal("name", name)
		.equal("picklistStatus", picklistStatus)
		.equal("isIssued", isIssued)
		.orderBy("picklistStatus", "ASC")
		.equal("customer.name", customerName, Customer)
		.includeModel("customer", Customer, {
			attributes: ["id", "name"],
		})
		.includeModel("user", User, {
			attributes: ["id", "name"],
		})
		.findAndCountAll(Picklist);
	return res.sendSuccess(200, data);
};

export const search = async (req, res) => {
	const {
		offset,
		limit,
		status,
		userId,
		customerId,
		customerName,
		name,
		picklistStatus,
		isIssued,
	} = req.query;
	const data = await req.queryBuilder
		.site(req)
		.status(status)
		.paginate(offset, limit)
		.equal("userId", userId)
		.equal("customerId", customerId)
		.like("name", name)
		.like("picklistStatus", picklistStatus)
		.equal("isIssued", isIssued)
		.like("name", name)
		.orderBy("picklistStatus", "ASC")
		.like("customer.name", customerName, Customer)
		.includeModel("customer", Customer, {
			attributes: ["id", "name"],
		})
		.includeModel("user", User, {
			attributes: ["id", "name"],
		})
		.findAndCountAll(Picklist);
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
	const { id: userId, siteId: userSiteId } = req.user;
	const picklistData = req.body; // [{ materialName, customerName, quantity }]

	if (!Array.isArray(picklistData) || picklistData.length === 0) {
		return res.sendError(400, "Picklist data array is required");
	}

	const materialNames = [...new Set(picklistData.map((p) => p.materialName))];
	const customerNames = [...new Set(picklistData.map((p) => p.customerName))];

	const customers = await Customer.findAll({
		where: { name: customerNames },
		transaction,
	});
	const foundCustomerNames = customers.map((c) => c.name);
	const missingCustomers = customerNames.filter((n) => !foundCustomerNames.includes(n));
	if (missingCustomers.length > 0) {
		return res.sendError(400, `Customers not found: ${missingCustomers.join(", ")}`);
	}

	const materials = await Material.findAll({
		where: { name: materialNames },
		transaction,
	});
	const foundMaterialNames = materials.map((m) => m.name);
	const missingMaterials = materialNames.filter((n) => !foundMaterialNames.includes(n));
	if (missingMaterials.length > 0) {
		return res.sendError(400, `Materials not found: ${missingMaterials.join(", ")}`);
	}

	// ---------- DETERMINE SITE ID FOR EACH ROW ----------
	for (const item of picklistData) {
		const customer = customers.find(
			(c) => c.name.toLowerCase().trim() === item.customerName.toLowerCase().trim(),
		);
		const material = materials.find(
			(m) => m.name.toLowerCase().trim() === item.materialName.toLowerCase().trim(),
		);

		if (!customer || !material) {
			return res.sendError(
				400,
				`Invalid data for customer '${item.customerName}' or material '${item.materialName}'`,
			);
		}
		// Both have site IDs — must match
		if (customer.siteId && material.siteId && customer.siteId !== material.siteId) {
			return res.sendError(
				400,
				`Site mismatch: Customer '${customer.name}' (site ${customer.siteId}) and Material '${material.name}' (site ${material.siteId})`,
			);
		}

		item.siteId = customer.siteId || material.siteId || userSiteId;

		if (!item.siteId) {
			return res.sendError(
				400,
				`Unable to determine siteId for material '${material.name}' and customer '${customer.name}'`,
			);
		}
	}

	// ---------- VALIDATE ALL ITEMS SHARE SAME SITE ----------
	const uniqueSiteIds = [...new Set(picklistData.map((i) => i.siteId))];
	if (uniqueSiteIds.length > 1) {
		return res.sendError(400, "All items must belong to the same site");
	}

	const siteId = userSiteId || uniqueSiteIds[0] || picklistData[0]?.siteId;

	const groupedByCustomer = {};
	for (const item of picklistData) {
		const name = item.customerName.trim();
		if (!groupedByCustomer[name]) groupedByCustomer[name] = [];
		groupedByCustomer[name].push(item);
	}

	const createdPicklists = [];

	const lastPicklist = await Picklist.findOne({
		order: [["id", "DESC"]],
		transaction,
		paranoid: false,
		lock: transaction.LOCK.UPDATE,
	});

	let lastNumber = 0;

	if (lastPicklist && lastPicklist.name) {
		const match = lastPicklist.name.match(/\d+$/);
		lastNumber = match ? parseInt(match[0], 10) : 0;
	}

	for (const [customerName, items] of Object.entries(groupedByCustomer)) {
		const customer = customers.find(
			(c) => c.name.toLowerCase().trim() === customerName.toLowerCase().trim(),
		);
		if (!customer)
			return res.sendError(404, `Customer not found for name: ${customerName}`);
		lastNumber += 1; // ✅ move this INSIDE the loop
		const name = `P${String(lastNumber).padStart(6, "0")}`;
		const picklist = await Picklist.create(
			{
				name,
				siteId,
				userId,
				customerId: customer.id,
				picklistStatus: "Pending",
			},
			{ transaction },
		);

		const picklistItems = items.map((p) => {
			const material = materials.find((m) => m.name === p.materialName);
			if (material.quantity < p.quantity)
				return res.sendError(400, `Insufficient stock for ${material.name}`);
			return {
				picklistId: picklist.id,
				materialId: material.id,
				materialName: material.name,
				materialDescription: material.description || "N/A",
				materialQuantity: p.quantity,
			};
		});

		await PicklistItem.bulkCreate(picklistItems, { transaction });
		createdPicklists.push(picklist.name);
	}

	res.sendSuccess(201, `Picklists created successfully for customers`, {
		picklists: createdPicklists,
	});
};

export const update = async (req, res) => {
	const { id } = req.params;
	const { transaction } = req;
	const { siteId, picklistStatus, isIssued, vehicleNo } = req.body;
	const { username } = req.user;
	const today = new Date();

	if (!siteId) delete req.body.siteId;

	const picklist = await Picklist.findByPk(id, {
		attributes: ["id", "isIssued", "vehicleNo", "picklistStatus"],
		transaction,
	});

	if (!picklist) {
		return res.sendError(404, "Picklist not found.");
	}

	if (picklist.isIssued && isIssued) {
		return res.sendError(400, "Cannot modify a picklist that has already been issued.");
	}

	if (picklistStatus === "In Progress") {
		req.body.startedAt = today.toISOString();
		req.body.startedBy = username;
	}

	if (picklistStatus === "Completed") {
		req.body.compeletedAt = today.toISOString();
		req.body.compeletedBy = username;
		const query = req.queryBuilder
			.equal("picklistId", id, PicklistItem)
			.gt("pickedQuantity", 0, PicklistItem)
			.toJSON();

		const pickedItems = await PicklistItem.count({
			where: query.where,
			transaction,
		});

		if (pickedItems === 0) {
			return res.sendError(400, "Pick at least one item before marking as completed");
		}
		const items = await PicklistItem.findAll({
			where: { picklistId: id },
			attributes: ["materialId", "materialQuantity", "pickedQuantity"],
			transaction,
		});

		// Check if all items are fully picked
		const allComplete = items.every(
			(item) => Number(item.pickedQuantity) >= Number(item.quantity),
		);

		if (!allComplete) {
			req.body.isPartial = true; // mark as partial
		} else {
			req.body.isPartial = false; // all items picked completely
		}
	}

	if (isIssued && !vehicleNo) {
		return res.sendError(400, "Vehicle number is required when issuing a picklist");
	}

	if (
		!picklist.isIssued &&
		(isIssued === true || isIssued === 1 || isIssued === "true")
	) {
		const today = new Date();
		req.body.issueDate = today;
		req.body.issueBy = username;

		const [inwardRows] = await Inward.update(
			{
				dispatchAt: today,
				isDispatch: true,
				dispatchBy: username,
				inStock: false,
			},
			{ where: { picklistId: id }, transaction },
		);
		if (inwardRows === 0) {
			return res.sendError(404, "No inward barcodes were updated for this picklist");
		}

		const picklistBarcodes = await PicklistItemBarcode.findAll({
			where: { "$picklistItem.picklistId$": id },
			include: [
				{
					model: Inward,
					as: "inward",
					attributes: ["shelfId", "materialId", "quantity"],
				},
				{
					model: PicklistItem,
					as: "picklistItem",
					attributes: ["picklistId"],
				},
			],
			transaction,
		});

		// 🔹 Aggregate material reductions
		const byMaterial = new Map();

		for (const pb of picklistBarcodes) {
			const inward = pb.inward;
			if (!inward) continue;
			if (inward.materialId) {
				byMaterial.set(
					inward.materialId,
					(byMaterial.get(inward.materialId) || 0) + inward.quantity,
				);
			}
		}
		// 🔹 Reduce material stock
		for (const [matId, qty] of byMaterial.entries()) {
			await Material.update(
				{ quantity: literal(`GREATEST(quantity - ${qty}, 0)`) },
				{ where: { id: matId }, transaction },
			);
		}
	}

	if (picklist.isIssued && picklistStatus && picklistStatus !== picklist.picklistStatus) {
		return res.sendError(400, "Cannot change status of an already issued picklist");
	}

	const [updatedRows] = await Picklist.update(req.body, {
		where: { id },
		transaction,
	});

	if (updatedRows === 0) {
		return res.sendError(404, "Picklist not found");
	}
	return res.sendSuccess(200, "Picklist updated successfully");
};

export const destroy = async (req, res) => {
	const { transaction } = req;
	const { id } = req.params;

	const picklistItems = await PicklistItem.findAll({
		where: { picklistId: id },
		transaction,
	});

	if (!picklistItems.length) {
		await Picklist.destroy({ where: { id }, transaction });
		return res.sendSuccess(200, "Picklist deleted successfully (no items)");
	}

	for (const item of picklistItems) {
		const barcodes = await PicklistItemBarcode.findAll({
			where: { picklistItemId: item.id },
			transaction,
		});

		for (const barcode of barcodes) {
			if (barcode.inwardId) {
				await Inward.update(
					{
						isPicked: false,
						pickerId: null,
						picklistId: null,
						picklistName: null,
						pickedBy: null,
					},
					{
						where: { id: barcode.inwardId },
						transaction,
					},
				);
			}
			await PicklistItemBarcode.destroy({
				where: { id: barcode.id },
				transaction,
			});
		}
	}

	await PicklistItem.destroy({
		where: { picklistId: id },
		transaction,
	});

	await Picklist.destroy({
		where: { id },
		transaction,
	});

	return res.sendSuccess(200, "Picklist and related data deleted successfully");
};
