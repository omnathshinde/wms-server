import express from "express";
import expressAsyncHandler from "express-async-handler";

import * as auditItem from "#src/controllers/auditItem.controller.js";

const auditItemRoutes = express.Router();

auditItemRoutes.route("").get(expressAsyncHandler(auditItem.getAll));

auditItemRoutes.route("/search/records").get(expressAsyncHandler(auditItem.search));

export default auditItemRoutes;
