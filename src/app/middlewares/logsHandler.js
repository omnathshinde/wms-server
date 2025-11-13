import dayjs from "dayjs";
import morgan from "morgan";

import logger from "#app/configs/logger.js";

const jsonFormat = (tokens, req, res) => {
	return JSON.stringify({
		timestamp: dayjs().format("DD-MM-YYYY HH:mm:ss"),
		ip: req.ip,
		method: tokens.method(req, res),
		url: tokens.url(req, res),
		status: parseInt(tokens.status(req, res)),
		responseTime: parseFloat(tokens["response-time"](req, res)),
		contentLength: parseInt(tokens.res(req, res, "content-length")) || 0,
		referrer: tokens.referrer(req, res),
		userAgent: tokens["user-agent"](req, res),
		httpVersion: tokens["http-version"](req, res),
	});
};

const logsHandler = morgan(jsonFormat, {
	stream: {
		write: (message) => {
			console.log(message);
			const json = JSON.parse(message);
			logger.info(json);
		},
	},
});

export default logsHandler;
