import { AccessScreen } from "#app/helpers/AppAdminData.js";
import { Access, Role, RoleAccess, sequelize, User } from "#src/index.js";

export default async () => {
	const transaction = await sequelize.transaction();
	try {
		const [role, roleCreated] = await Role.findOrCreate({
			where: { name: "admin" },
			defaults: { name: "admin" },
			transaction,
			raw: true,
		});

		await Access.bulkCreate(AccessScreen, { transaction, ignoreDuplicates: true });

		const allAccess = await Access.findAll({
			where: { name: AccessScreen.map((a) => a.name) },
			transaction,
		});

		const roleAccess = allAccess.map((access) => ({
			roleId: role.id,
			accessId: access.id,
			status: true,
		}));

		await RoleAccess.bulkCreate(roleAccess, {
			transaction,
			ignoreDuplicates: true,
		});
		const [user, userCreated] = await User.findOrCreate({
			where: { username: "admin" },
			defaults: {
				name: "Admin",
				username: "admin",
				password: "Admin@123",
				employeeId: 1,
				roleId: role.id,
			},
			transaction,
			raw: true,
			logging: false,
		});

		if (userCreated && roleCreated)
			console.log("🛡️ Admin created:", user.username, role.name);
		else console.log("🔰 Admin already exists:", user.username, role.name);
		await transaction.commit();
	} catch (error) {
		await transaction.rollback();

		if (error.name === "SequelizeUniqueConstraintError") {
			console.log("🔰 Admin already exists (caught unique constraint)");
		} else {
			console.error("❌ Failed to seed admin user:", error);
		}
	}
};
