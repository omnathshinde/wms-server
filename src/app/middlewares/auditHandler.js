import AppLocalStorage from "#src/app/helpers/AppLocalStorage.js";

export default (req, res, next) => {
	AppLocalStorage.run({ user: req.user?.username || "system" }, () => next());
};
