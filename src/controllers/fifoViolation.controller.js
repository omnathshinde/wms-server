import { Customer, FifoViolation, Inward, Picklist } from "#src/index.js";

export const getAll = async (req, res) => {
	const { offset, limit, status, barcode, type } = req.query;
	const data = await req.queryBuilder
		.site(req)
		.status(status)
		.paginate(offset, limit)
		.equal("barcode", barcode)
		.equal("type", type)
		.includeModel("inward", Inward, {
			attributes: ["id", "materialName"],
		})
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
		.findAndCountAll(FifoViolation);
	return res.sendSuccess(200, data);
};

export const search = async (req, res) => {
	const { offset, limit, status, barcode, type } = req.query;
	const data = await req.queryBuilder
		.site(req)
		.status(status)
		.paginate(offset, limit)
		.like("barcode", barcode)
		.like("type", type)
		.includeModel("inward", Inward, {
			attributes: ["id", "materialName"],
		})
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
		.findAndCountAll(FifoViolation);
	return res.sendSuccess(200, data);
};
