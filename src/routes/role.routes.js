import express from "express";
import expressAsyncHandler from "express-async-handler";

import asyncHandler from "#src/app/middlewares/asyncHandler.js";
import * as role from "#src/controllers/role.controller.js";

const roleRoutes = express.Router();

roleRoutes
	.route("")
	.get(expressAsyncHandler(role.getAll))
	.post(asyncHandler(role.create));

roleRoutes
	.route("/:id")
	.get(expressAsyncHandler(role.getOne))
	.put(expressAsyncHandler(role.update))
	.patch(expressAsyncHandler(role.restore))
	.delete(expressAsyncHandler(role.destroy));

roleRoutes.route("/bulk-records").post(expressAsyncHandler(role.bulkCreate));
roleRoutes.route("/search/records").get(expressAsyncHandler(role.search));

export default roleRoutes;
