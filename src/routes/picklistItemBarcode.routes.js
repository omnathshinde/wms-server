import express from "express";
import expressAsyncHandler from "express-async-handler";

import * as picklistItemBarcode from "#src/controllers/picklistItemBarcode.controller.js";

const picklistItemBarcodeRoutes = express.Router();

picklistItemBarcodeRoutes
	.route("")
	.get(expressAsyncHandler(picklistItemBarcode.getAll))
	.post(expressAsyncHandler(picklistItemBarcode.create));

picklistItemBarcodeRoutes
	.route("/:id")
	.delete(expressAsyncHandler(picklistItemBarcode.destroy));

picklistItemBarcodeRoutes
	.route("/bulk-records")
	.post(expressAsyncHandler(picklistItemBarcode.bulkCreate));

picklistItemBarcodeRoutes
	.route("/search/records")
	.get(expressAsyncHandler(picklistItemBarcode.search));

export default picklistItemBarcodeRoutes;
