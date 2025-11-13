import express from "express";
import expressAsyncHandler from "express-async-handler";

import * as auditItemBarcode from "#src/controllers/auditItemBarcode.controller.js";

const auditItemBarcodeRoutes = express.Router();

auditItemBarcodeRoutes.route("").get(expressAsyncHandler(auditItemBarcode.getAll));

auditItemBarcodeRoutes.route("").put(expressAsyncHandler(auditItemBarcode.update));
auditItemBarcodeRoutes
	.route("/search/records")
	.get(expressAsyncHandler(auditItemBarcode.search));

export default auditItemBarcodeRoutes;
