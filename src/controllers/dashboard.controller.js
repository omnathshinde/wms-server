import { Inward, Material } from "#src/index.js";

export const getAll = async (req, res) => {
	const invetory = await Inward.count();
	const material = await Material.count();

	const qcPending = await Inward.count({
		where: {
			qcStatus: "Pending",
		},
	});
	const qcTotal = await Inward.count({
		where: {
			qcStatus: "Pending",
		},
	});
	const qcApproved = await Inward.count({
		where: {
			qcStatus: "Approved",
		},
	});
	const qcRejected = await Inward.count({
		where: {
			qcStatus: "Rejected",
		},
	});
	const data = {
		inventory: invetory,
		material: material,
		qc: {
			total: qcTotal,
			pending: qcPending,
			approved: qcApproved,
			rejected: qcRejected,
		},
	};

	return res.sendSuccess(200, data);
};
