import express from "express";
import expressAsyncHandler from "express-async-handler";

import * as picklistItem from "./picklistItem.controller.js";

const picklistItemRoutes = express.Router();

picklistItemRoutes
	.route("")
	.get(expressAsyncHandler(picklistItem.getAll))
	.post(expressAsyncHandler(picklistItem.create));

picklistItemRoutes
	.route("/:id")
	.get(expressAsyncHandler(picklistItem.getOne))
	.put(expressAsyncHandler(picklistItem.update));

picklistItemRoutes.route("/search/records").get(expressAsyncHandler(picklistItem.search));

export default picklistItemRoutes;
