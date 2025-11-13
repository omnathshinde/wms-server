import express from "express";
import expressAsyncHandler from "express-async-handler";

import * as uom from "#src/controllers/uom.controller.js";

const uomRoutes = express.Router();

uomRoutes
	.route("")
	.get(expressAsyncHandler(uom.getAll))
	.post(expressAsyncHandler(uom.create));

uomRoutes
	.route("/:id")
	.get(expressAsyncHandler(uom.getOne))
	.put(expressAsyncHandler(uom.update))
	.patch(expressAsyncHandler(uom.restore))
	.delete(expressAsyncHandler(uom.destroy));

uomRoutes.route("/bulk-records").post(expressAsyncHandler(uom.bulkCreate));
uomRoutes.route("/search/records").get(expressAsyncHandler(uom.search));

export default uomRoutes;
