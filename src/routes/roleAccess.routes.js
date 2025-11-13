import express from "express";
import expressAsyncHandler from "express-async-handler";

import * as roleAccess from "#src/controllers/roleAccess.controller.js";

const roleAccessRoutes = express.Router();

roleAccessRoutes
	.route("")
	.get(expressAsyncHandler(roleAccess.getAll))
	.post(expressAsyncHandler(roleAccess.create));

export default roleAccessRoutes;
