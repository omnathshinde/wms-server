import express from "express";
import expressAsyncHandler from "express-async-handler";

import * as audit from "#src/controllers/audit.controller.js";

const auditRoutes = express.Router();

auditRoutes
	.route("")
	.get(expressAsyncHandler(audit.getAll))
	.post(expressAsyncHandler(audit.create));

auditRoutes
	.route("/:id")
	.get(expressAsyncHandler(audit.getOne))
	.put(expressAsyncHandler(audit.update));

auditRoutes.route("/search/records").get(expressAsyncHandler(audit.search));

export default auditRoutes;
