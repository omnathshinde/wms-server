import { Inward, Material, Picklist } from "#src/models/index.js";

export const getAll = async (req, res) => {
	const [
		totalInventory,
		totalMaterials,

		qcPending,
		qcApproved,
		qcRejected,

		putawayPending,
		putawayCompleted,

		pickingPending,
		pickingCompleted,

		dispatched,
		returned,

		inStock,
		outOfStock,
	] = await Promise.all([
		Inward.count(),
		Material.count(),

		Inward.count({ where: { qcStatus: "Pending" } }),
		Inward.count({ where: { qcStatus: "Approved" } }),
		Inward.count({ where: { qcStatus: "Rejected" } }),

		Inward.count({ where: { isPutAway: false } }),
		Inward.count({ where: { isPutAway: true } }),

		Picklist.count({ where: { picklistStatus: "Pending" } }),
		Picklist.count({ where: { picklistStatus: "Completed" } }),

		Inward.count({ where: { isDispatch: true } }),
		Inward.count({ where: { isReturn: true } }),

		Inward.count({ where: { inStock: true } }),
		Inward.count({ where: { inStock: false } }),
	]);

	const data = {
		inventory: {
			total: totalInventory,
			inStock,
			outOfStock,
		},

		materials: {
			total: totalMaterials,
		},

		qc: {
			total: qcPending + qcApproved + qcRejected,
			pending: qcPending,
			approved: qcApproved,
			rejected: qcRejected,
		},

		putaway: {
			pending: putawayPending,
			completed: putawayCompleted,
		},

		picking: {
			pending: pickingPending,
			completed: pickingCompleted,
		},

		dispatch: {
			total: dispatched,
		},

		returns: {
			total: returned,
		},
	};

	return res.sendSuccess(200, data);
};
