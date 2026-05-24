import express from "express";
import expressAsyncHandler from "express-async-handler";

import * as dashboard from "./dashboard.controller.js";

const dashboardRoutes = express.Router();

dashboardRoutes.route("").get(expressAsyncHandler(dashboard.getAll));

export default dashboardRoutes;
