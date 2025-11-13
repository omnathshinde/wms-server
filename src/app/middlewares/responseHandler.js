import HttpError from "http-errors";
const toPlain = (data) => {
	if (Array.isArray(data)) {
		return data.map((d) => (typeof d?.get === "function" ? d.get({ plain: true }) : d));
	}
	return typeof data?.get === "function" ? data.get({ plain: true }) : data;
};

export default (req, res, next) => {
	res.sendSuccess = (status = 200, data = null) => {
		let response = { status: true };
		if (typeof data !== "string") {
			data = toPlain(data);
			response = data;
		} else {
			response.message = data;
		}
		return res.status(status).json(response);
	};

	res.sendError = (status = 500, message = "Internal Server Error") => {
		throw HttpError(status, message);
	};
	next();
};
