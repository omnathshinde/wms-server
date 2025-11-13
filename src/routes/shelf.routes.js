import express from "express";
import expressAsyncHandler from "express-async-handler";

import * as shelf from "#src/controllers/shelf.controller.js";

const shelfRoutes = express.Router();

shelfRoutes
	.route("")
	.get(expressAsyncHandler(shelf.getAll))
	.post(expressAsyncHandler(shelf.create));

shelfRoutes
	.route("/:id")
	.get(expressAsyncHandler(shelf.getOne))
	.put(expressAsyncHandler(shelf.update))
	.patch(expressAsyncHandler(shelf.restore))
	.delete(expressAsyncHandler(shelf.destroy));

shelfRoutes.route("/bulk-records").post(expressAsyncHandler(shelf.bulkCreate));
shelfRoutes.route("/search/records").get(expressAsyncHandler(shelf.search));

export default shelfRoutes;
