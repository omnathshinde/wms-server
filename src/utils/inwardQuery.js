import { Inward, Material, Picklist, Shelf, Site, User } from "#src/index.js";

export default async function inwardQuery(req, useLike = false) {
	const {
		name,
		offset,
		limit,
		status,
		siteName,
		barcode,
		autoSerial,
		materialId,
		materialName,
		materialDescription,
		mrp,
		batch,
		invoice,
		manufacturingDate,
		qcStatus,
		isPutAway,
		shelfName,
		shelfId,
		isPicked,
		picklistId,
		picklistName,
		pickedBy,
		isDispatch,
		isReturn,
		inStock,
		auditStatus,
	} = req.query;

	const builder = req.queryBuilder
		.site(req)
		.status(status)
		.paginate(offset, limit)
		.includeModel("site", Site, {
			attributes: ["id", "name"],
		})
		.like("material.name", name, Material)
		.includeModel("material", Material, {
			attributes: ["id", "name", "description"],
		});

	let result;
	if (useLike) {
		result = await builder
			.like("barcode", barcode)
			.like("materialName", materialName)
			.like("materialDescription", materialDescription)
			.like("mrp", mrp)
			.like("batch", batch)
			.like("invoice", invoice)
			.like("manufacturingDate", manufacturingDate)
			.like("qcStatus", qcStatus)
			.like("shelfName", shelfName)
			.like("picklistName", picklistName)
			.like("pickedBy", pickedBy)
			.like("site.name", siteName, Site)
			.equal("autoSerial", autoSerial)
			.equal("materialId", materialId)
			.equal("isPutAway", isPutAway)
			.equal("shelfId", shelfId)
			.equal("isPicked", isPicked)
			.equal("picklistId", picklistId)
			.equal("isDispatch", isDispatch)
			.equal("isReturn", isReturn)
			.equal("inStock", inStock)
			.equal("auditStatus", auditStatus)
			.findAndCountAll(Inward);
	} else {
		result = await builder
			.equal("barcode", barcode)
			.equal("materialName", materialName)
			.equal("materialDescription", materialDescription)
			.equal("mrp", mrp)
			.equal("batch", batch)
			.equal("invoice", invoice)
			.equal("manufacturingDate", manufacturingDate)
			.equal("qcStatus", qcStatus)
			.equal("shelfName", shelfName)
			.equal("picklistName", picklistName)
			.equal("pickedBy", pickedBy)
			.equal("site.name", siteName, Site)
			.equal("autoSerial", autoSerial)
			.equal("materialId", materialId)
			.equal("isPutAway", isPutAway)
			.equal("shelfId", shelfId)
			.equal("isPicked", isPicked)
			.equal("picklistId", picklistId)
			.equal("isDispatch", isDispatch)
			.equal("isReturn", isReturn)
			.equal("inStock", inStock)
			.equal("auditStatus", auditStatus)
			.includeModel("site", Site, {
				attributes: ["id", "name"],
			})
			.includeModel("shelf", Shelf, {
				attributes: ["id", "name"],
			})
			.includeModel("material", Material, {
				attributes: ["id", "name"],
			})
			.includeModel("picklist", Picklist, {
				attributes: ["id", "name"],
			})
			.includeModel("picker", User, {
				attributes: ["id", "name"],
			})
			.findAndCountAll(Inward);
	}

	return result;
}
