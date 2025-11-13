import express from "express";
import expressAsyncHandler from "express-async-handler";

import * as putaway from "#src/controllers/putaway.controller.js";

const putawayRoutes = express.Router();

putawayRoutes
	.route("")
	.get(expressAsyncHandler(putaway.getAll))
	.post(expressAsyncHandler(putaway.create));

putawayRoutes.route("/:id").get(expressAsyncHandler(putaway.getOne));
putawayRoutes.route("/bulk-records").post(expressAsyncHandler(putaway.bulkCreate));
putawayRoutes.route("/search/records").get(expressAsyncHandler(putaway.search));

export default putawayRoutes;
