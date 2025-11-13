import AppLocalStorage from "#app/helpers/AppLocalStorage.js";

export default (req, res, next) => {
	if (!req.body) req.body = {};
	const siteId = req.user?.siteId || null;
	if (Array.isArray(req.body)) {
		req.body = req.body.map((item) => ({
			...item,
			siteId: item.siteId ?? siteId,
		}));
	} else {
		if (!req.body?.siteId) req.body.siteId = siteId;
	}
	AppLocalStorage.run({ user: req.user?.username || "system" }, () => next());
};
