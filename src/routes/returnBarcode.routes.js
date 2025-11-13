import express from "express";
import expressAsyncHandler from "express-async-handler";

import * as returnBarcode from "#src/controllers/returnBarcode.controller.js";

const returnBarcodeRoutes = express.Router();

returnBarcodeRoutes
	.route("")
	.get(expressAsyncHandler(returnBarcode.getAll))
	.post(expressAsyncHandler(returnBarcode.create));

returnBarcodeRoutes.route("/:id").get(expressAsyncHandler(returnBarcode.getOne));

returnBarcodeRoutes
	.route("/search/records")
	.get(expressAsyncHandler(returnBarcode.search));

export default returnBarcodeRoutes;
