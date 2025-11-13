import express from "express";
import expressAsyncHandler from "express-async-handler";

import * as fifoViolation from "#src/controllers/fifoViolation.controller.js";

const fifoViolationRoutes = express.Router();

fifoViolationRoutes.route("").get(expressAsyncHandler(fifoViolation.getAll));

fifoViolationRoutes
	.route("/search/records")
	.get(expressAsyncHandler(fifoViolation.search));

export default fifoViolationRoutes;
