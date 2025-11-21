import argon2 from "argon2";
import jwt from "jsonwebtoken";

import env from "#app/configs/env.js";
import logger from "#app/configs/logger.js";
import { Access, Role, RoleAccess, Site, User } from "#src/index.js";

const SECRET_KEY = env.JWT_SECRET_KEY;

export default async (req, res) => {
	// try {
	const { username, password } = req.body;

	if (!username || !password) {
		return res.sendError(400, "Username and password are required");
	}

	const user = await User.findOne({
		where: { username },
		include: [
			{
				model: Role,
				as: "role",
				attributes: ["id", "name"],
			},
			{
				model: Site,
				as: "site",
				attributes: ["id", "name"],
			},
		],
		raw: true,
	});

	if (!user || Object.keys(user).length === 0) {
		return res.sendError(404, "User not found");
	}

	const isPasswordValid = await argon2.verify(user.password, password);

	console.log(isPasswordValid);

	if (!isPasswordValid) {
		return res.sendError(401, "Invalid password");
	}

	const roleAccess = await RoleAccess.findAll({
		where: { roleId: user.roleId, status: true },
		attributes: ["accessId"],
		raw: true,
	});

	const accessIds = roleAccess.map((x) => x.accessId);

	// ✅ Fetch Access names & permissions
	const userAccess = await Access.findAll({
		where: { id: accessIds },
		attributes: ["id", "name", "description"],
		raw: true,
	});

	const tokenData = {
		id: user.id,
		name: user.name,
		username: user.username,
		roleId: user.roleId,
		siteId: user.siteId,
		employeeId: user.employeeId,
	};

	const token = jwt.sign(tokenData, SECRET_KEY);
	req.user = { username: user.username };

	const accessNames = userAccess.map((a) => a.name);
	const data = {
		user: {
			id: user.id,
			name: user.name,
			username: user.username,
			roleId: user.roleId,
			siteId: user.siteId,
			role: user["role.name"] || "",
			site: user["site.name"] || "",
			employeeId: user.employeeId,
		},
		access: accessNames,
		token,
	};
	logger.warn("User Logged", { "Auth User": user.username });
	return res.sendSuccess(200, data);
	// } catch (error) {
	// 	logger.error("Sign-in error:", error);
	// 	console.log(error);

	// 	return res.sendError(500, "Password mismatch");
	// }
};
