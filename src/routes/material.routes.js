import express from "express";
import expressAsyncHandler from "express-async-handler";

import * as material from "#src/controllers/material.controller.js";

const materialRoutes = express.Router();

materialRoutes
	.route("")
	.get(expressAsyncHandler(material.getAll))
	.post(expressAsyncHandler(material.create));

materialRoutes
	.route("/:id")
	.get(expressAsyncHandler(material.getOne))
	.put(expressAsyncHandler(material.update))
	.patch(expressAsyncHandler(material.restore))
	.delete(expressAsyncHandler(material.destroy));

materialRoutes.route("/bulk-records").post(expressAsyncHandler(material.bulkCreate));
materialRoutes.route("/search/records").get(expressAsyncHandler(material.search));

export default materialRoutes;
