import express from "express";
import expressAsyncHandler from "express-async-handler";

import * as user from "#src/controllers/user.controller.js";

const userRoutes = express.Router();

userRoutes
	.route("")
	.get(expressAsyncHandler(user.getAll))
	.post(expressAsyncHandler(user.create));

userRoutes
	.route("/:id")
	.get(expressAsyncHandler(user.getOne))
	.put(expressAsyncHandler(user.update))
	.patch(expressAsyncHandler(user.restore))
	.delete(expressAsyncHandler(user.destroy));

userRoutes
	.route("/bulk-records")
	.post(expressAsyncHandler(user.bulkCreate))
	.put(expressAsyncHandler(user.bulkUpdate))
	.delete(expressAsyncHandler(user.bulkDelete));

userRoutes.route("/search/records").get(expressAsyncHandler(user.search));

export default userRoutes;
