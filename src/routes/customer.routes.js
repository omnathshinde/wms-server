import express from "express";
import expressAsyncHandler from "express-async-handler";

import * as customer from "#src/controllers/customer.controller.js";

const customerRoutes = express.Router();

customerRoutes
	.route("")
	.get(expressAsyncHandler(customer.getAll))
	.post(expressAsyncHandler(customer.create));

customerRoutes
	.route("/:id")
	.get(expressAsyncHandler(customer.getOne))
	.put(expressAsyncHandler(customer.update))
	.patch(expressAsyncHandler(customer.restore))
	.delete(expressAsyncHandler(customer.destroy));

customerRoutes.route("/bulk-records").post(expressAsyncHandler(customer.bulkCreate));
customerRoutes.route("/search/records").get(expressAsyncHandler(customer.search));

export default customerRoutes;
