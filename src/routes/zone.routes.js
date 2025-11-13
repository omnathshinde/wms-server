import express from "express";
import expressAsyncHandler from "express-async-handler";

import * as zone from "#src/controllers/zone.controller.js";

const zoneRoutes = express.Router();

zoneRoutes
	.route("")
	.get(expressAsyncHandler(zone.getAll))
	.post(expressAsyncHandler(zone.create));

zoneRoutes
	.route("/:id")
	.get(expressAsyncHandler(zone.getOne))
	.put(expressAsyncHandler(zone.update))
	.patch(expressAsyncHandler(zone.restore))
	.delete(expressAsyncHandler(zone.destroy));

zoneRoutes.route("/bulk-records").post(expressAsyncHandler(zone.bulkCreate));
zoneRoutes.route("/search/records").get(expressAsyncHandler(zone.search));

export default zoneRoutes;
