export default (screen) => (req, res, next) => {
	const access = req.user.access || [];

	if (!access.includes(screen)) {
		return res.sendError(403, "Access denied");
	}
	next();
};
