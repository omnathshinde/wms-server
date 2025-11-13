import express from "express";
import expressAsyncHandler from "express-async-handler";

import * as rack from "#src/controllers/rack.controller.js";

const rackRoutes = express.Router();

rackRoutes
	.route("")
	.get(expressAsyncHandler(rack.getAll))
	.post(expressAsyncHandler(rack.create));

rackRoutes
	.route("/:id")
	.get(expressAsyncHandler(rack.getOne))
	.put(expressAsyncHandler(rack.update))
	.patch(expressAsyncHandler(rack.restore))
	.delete(expressAsyncHandler(rack.destroy));

rackRoutes.route("/bulk-records").post(expressAsyncHandler(rack.bulkCreate));
rackRoutes.route("/search/records").get(expressAsyncHandler(rack.search));

export default rackRoutes;
