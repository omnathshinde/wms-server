import { Inward, QC } from "#src/index.js";

export const getAll = async (req, res) => {
	const { offset, limit, status, inwardId, qcStatus, remark } = req.query;
	const data = await req.queryBuilder
		.paginate(offset, limit)
		.status(status)
		.equal("inwardId", inwardId)
		.equal("qcStatus", qcStatus)
		.equal("remark", remark)
		.findAndCountAll(QC);
	return res.sendSuccess(200, data);
};

export const search = async (req, res) => {
	const { offset, limit, status, inwardId, qcStatus, remark } = req.query;
	const data = await req.queryBuilder
		.paginate(offset, limit)
		.status(status)
		.equal("inwardId", inwardId)
		.like("qcStatus", qcStatus)
		.like("remark", remark)
		.findAndCountAll(QC);
	return res.sendSuccess(200, data);
};

export const getOne = async (req, res) => {
	const data = await QC.findByPk(req.params.id);
	if (!data) {
		res.sendError(404, "QC transaction not found");
	}
	return res.sendSuccess(200, data);
};

export const create = async (req, res) => {
	const { transaction } = req;
	const { inwardId, qcStatus, remark } = req.body;

	if (!inwardId || !qcStatus || !remark) {
		return res.sendError(400, "inwardId, qcStatus, and remark are required");
	}
	await QC.create(req.body, { transaction });
	await Inward.update(
		{
			qcStatus,
			qcRemark: remark,
		},
		{
			where: { id: inwardId },
			transaction,
		},
	);

	return res.sendSuccess(200, "QC transaction completed successfully");
};

export const bulkCreate = async (req, res) => {
	const { transaction } = req;
	const data = req.body;

	// ---------- VALIDATION ----------
	if (!Array.isArray(data) || data.length === 0)
		return res.sendError(400, "QC list must be a non-empty array");

	for (const item of data) {
		if (!item.inwardId || !item.qcStatus || !item.remark) {
			return res.sendError(
				400,
				"Each QC entry must include inwardId, qcStatus, and remark",
			);
		}
	}

	const qcRecords = await QC.bulkCreate(data, {
		ignoreDuplicates: true,
		validate: true,
		transaction,
	});

	// ---------- UPDATE RELATED INWARD RECORDS ----------
	await Promise.all(
		data.map((q) =>
			Inward.update(
				{
					qcStatus: q.qcStatus,
					qcRemark: q.remark,
				},
				{
					where: { id: q.inwardId },
					transaction,
				},
			),
		),
	);
	const insertedCount = qcRecords.filter((r) => !!r.id).length;
	return res.sendSuccess(201, `${insertedCount} QC records created successfully`);
};
