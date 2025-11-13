import express from "express";
import expressAsyncHandler from "express-async-handler";

import * as inward from "#src/controllers/inward.controller.js";

const inwardRoutes = express.Router();

inwardRoutes
	.route("")
	.get(expressAsyncHandler(inward.getAll))
	.post(expressAsyncHandler(inward.create));

inwardRoutes
	.route("/:id")
	.get(expressAsyncHandler(inward.getOne))
	.put(expressAsyncHandler(inward.update))
	.patch(expressAsyncHandler(inward.restore))
	.delete(expressAsyncHandler(inward.destroy));

inwardRoutes.route("/bulk-records").post(expressAsyncHandler(inward.bulkCreate));
inwardRoutes
	.route("/bulk-records/generate-barcodes")
	.post(expressAsyncHandler(inward.generateBarcodes));
inwardRoutes.route("/search/records").get(expressAsyncHandler(inward.search));

export default inwardRoutes;
