import express from "express";
import expressAsyncHandler from "express-async-handler";

import * as site from "#src/controllers/site.controller.js";

const siteRoutes = express.Router();

siteRoutes
	.route("")
	.get(expressAsyncHandler(site.getAll))
	.post(expressAsyncHandler(site.create));

siteRoutes
	.route("/:id")
	.get(expressAsyncHandler(site.getOne))
	.put(expressAsyncHandler(site.update))
	.patch(expressAsyncHandler(site.restore))
	.delete(expressAsyncHandler(site.destroy));

siteRoutes.route("/bulk-records").post(expressAsyncHandler(site.bulkCreate));
siteRoutes.route("/search/records").get(expressAsyncHandler(site.search));

export default siteRoutes;
