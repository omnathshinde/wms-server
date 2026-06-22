import { Op } from "sequelize";

import {
	Audit,
	Customer,
	Inward,
	Material,
	Picklist,
	Rack,
	Shelf,
	Site,
	Zone,
} from "#src/models/index.js";

export const getAll = async (req, res) => {
	const { startDate, endDate, siteName } = req.query;

	const inwardWhere = {};

	if (req.user?.siteId) {
		inwardWhere.siteId = req.user.siteId;
	} else if (siteName) {
		const site = await Site.findOne({
			where: { name: siteName },
			attributes: ["id"],
		});

		if (!site) {
			return res.sendError(404, "Site not found");
		}

		inwardWhere.siteId = site.id;
	}

	if (startDate && endDate) {
		inwardWhere.createdAt = {
			[Op.between]: [new Date(startDate), new Date(endDate)],
		};
	}

	const siteId = inwardWhere.siteId;

	const siteWhere = siteId ? { id: siteId } : {};
	const childWhere = siteId ? { siteId } : {};

	const materialStockWhere = {
		...childWhere,
		quantity: {
			[Op.gt]: 0,
		},
	};

	const siteInclude = {
		model: Site,
		as: "site",
		required: true,
	};
	if (siteId) {
		siteInclude.where = {
			id: siteId,
		};
	}
	const zoneInclude = {
		model: Zone,
		as: "zone",
		required: true,
		include: [siteInclude],
	};
	const rackInclude = {
		model: Rack,
		as: "rack",
		required: true,
		include: [zoneInclude],
	};
	// Master Data
	const [
		totalCustomers,

		totalSites,
		totalZones,
		totalRacks,
		totalShelves,

		totalMaterials,
		materialInStock,
	] = await Promise.all([
		Customer.count({
			where: childWhere,
		}),
		Site.count({ where: siteWhere }),
		Zone.count({
			include: [siteInclude],
			distinct: true,
			col: "id",
		}),
		Rack.count({
			include: [zoneInclude],
			distinct: true,
			col: "id",
		}),
		Shelf.count({
			include: [rackInclude],
			distinct: true,
			col: "id",
		}),
		Material.count({ where: childWhere }),
		Material.count({ where: materialStockWhere }),
	]);

	// Inbound
	const [
		totalInventory,

		qcPending,
		qcApproved,
		qcRejected,

		putawayPending,
		putawayCompleted,

		inStock,
		outOfStock,
	] = await Promise.all([
		Inward.count({ where: inwardWhere }),
		Inward.count({ where: { ...inwardWhere, qcStatus: "Pending" } }),
		Inward.count({ where: { ...inwardWhere, qcStatus: "Approved" } }),
		Inward.count({ where: { ...inwardWhere, qcStatus: "Rejected" } }),

		Inward.count({ where: { ...inwardWhere, isPutAway: false } }),
		Inward.count({ where: { ...inwardWhere, isPutAway: true } }),

		Inward.count({ where: { ...inwardWhere, inStock: true } }),
		Inward.count({ where: { ...inwardWhere, inStock: false } }),
	]);

	// Outbound
	const [
		pickingPending,
		pickingInProgress,
		pickingCompleted,

		picked,
		dispatched,

		returned,
	] = await Promise.all([
		Picklist.count({ where: { ...inwardWhere, picklistStatus: "Pending" } }),
		Picklist.count({ where: { ...inwardWhere, picklistStatus: "In Progress" } }),
		Picklist.count({ where: { ...inwardWhere, picklistStatus: "Completed" } }),

		Inward.count({ where: { ...inwardWhere, isPicked: true } }),
		Inward.count({ where: { ...inwardWhere, isDispatch: true } }),

		Inward.count({ where: { ...inwardWhere, isReturn: true } }),
	]);

	// Audit
	const [auditPending, auditInProgress, auditCompleted] = await Promise.all([
		Audit.count({ where: { ...inwardWhere, status: "Pending" } }),
		Audit.count({ where: { ...inwardWhere, status: "In Progress" } }),
		Audit.count({ where: { ...inwardWhere, status: "Completed" } }),
	]);

	// Today
	const today = new Date();
	today.setHours(0, 0, 0, 0);

	const todayWhere = {
		...inwardWhere,
		createdAt: {
			[Op.gte]: today,
		},
	};

	const [
		todayInward,
		todayQc,
		todayPutaway,
		todayPicklist,
		todayDispatch,
		todayReturns,
		todayAudits,
	] = await Promise.all([
		Inward.count({ where: todayWhere }),
		Inward.count({ where: { ...todayWhere, qcStatus: "Approved" } }),
		Inward.count({ where: { ...todayWhere, isPutAway: true } }),
		Picklist.count({ where: todayWhere }),
		Inward.count({ where: { ...todayWhere, isDispatch: true } }),
		Inward.count({ where: { ...todayWhere, isReturn: true } }),
		Audit.count({ where: { ...childWhere, createdAt: { [Op.gte]: today } } }),
	]);

	const data = {
		masterData: {
			customers: totalCustomers,

			materials: {
				total: totalMaterials,
				inStock: materialInStock,
				outOfStock: totalMaterials - materialInStock,
			},

			locations: {
				sites: totalSites,
				zones: totalZones,
				racks: totalRacks,
				shelves: totalShelves,
				utilizationPercentage: 0,
			},
		},

		inbound: {
			inventory: {
				total: totalInventory,
				inStock,
				outOfStock,
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
		},

		outbound: {
			stockMovement: {
				picked,
				issued: dispatched,
			},

			picklist: {
				total: pickingPending + pickingInProgress + pickingCompleted,
				pending: pickingPending,
				inProgress: pickingInProgress,
				completed: pickingCompleted,
				issued: dispatched,
			},

			dispatch: {
				total: picked + dispatched,
				pending: picked,
				dispatched,
			},
		},

		returns: {
			total: returned,
		},

		audit: {
			total: auditPending + auditInProgress + auditCompleted,
			pending: auditPending,
			inProgress: auditInProgress,
			completed: auditCompleted,
		},

		today: {
			inward: todayInward,
			qc: todayQc,
			putaway: todayPutaway,
			picklist: todayPicklist,
			dispatch: todayDispatch,
			returns: todayReturns,
			audits: todayAudits,
		},
	};

	return res.sendSuccess(200, data);
};
