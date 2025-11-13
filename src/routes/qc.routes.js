import express from "express";
import expressAsyncHandler from "express-async-handler";

import * as qc from "#src/controllers/qc.controller.js";

const qcRoutes = express.Router();

qcRoutes
	.route("")
	.get(expressAsyncHandler(qc.getAll))
	.post(expressAsyncHandler(qc.create));

qcRoutes.route("/:id").get(expressAsyncHandler(qc.getOne));

qcRoutes.route("/bulk-records").post(expressAsyncHandler(qc.bulkCreate));
qcRoutes.route("/search/records").get(expressAsyncHandler(qc.search));

export default qcRoutes;
