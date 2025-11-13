import express from "express";
import expressAsyncHandler from "express-async-handler";

import * as picklist from "#src/controllers/picklist.controller.js";

const picklistRoutes = express.Router();

picklistRoutes
	.route("")
	.get(expressAsyncHandler(picklist.getAll))
	.post(expressAsyncHandler(picklist.create));

picklistRoutes
	.route("/:id")
	.get(expressAsyncHandler(picklist.getOne))
	.put(expressAsyncHandler(picklist.update))
	.delete(expressAsyncHandler(picklist.destroy));

picklistRoutes.route("/search/records").get(expressAsyncHandler(picklist.search));

export default picklistRoutes;
