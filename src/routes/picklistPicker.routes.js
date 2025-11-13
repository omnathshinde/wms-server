import express from "express";
import expressAsyncHandler from "express-async-handler";

import * as picklistPicker from "#src/controllers/picklistPicker.controller.js";

const picklistPickerRoutes = express.Router();

picklistPickerRoutes
	.route("")
	.get(expressAsyncHandler(picklistPicker.getAll))
	.post(expressAsyncHandler(picklistPicker.create));

picklistPickerRoutes.route("/:id").get(expressAsyncHandler(picklistPicker.getOne));

picklistPickerRoutes
	.route("/search/records")
	.get(expressAsyncHandler(picklistPicker.search));

export default picklistPickerRoutes;
