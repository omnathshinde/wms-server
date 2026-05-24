import { DataTypes } from "sequelize";

import env from "#src/app/configs/env.js";
import asyncLocalStorage from "#src/app/helpers/AppLocalStorage.js";

const getCurrentUser = () => asyncLocalStorage.getStore()?.user ?? "system";

export default async (sequelize) => {
	// 🔌 Connection Hooks
	sequelize.addHook("beforeConnect", (config) => {
		console.log("🔌 Connecting to DB...", {
			host: config.host,
			database: config.database,
			dialect: sequelize.getDialect(),
		});
	});

	sequelize.addHook("afterConnect", ({ config }) => {
		console.log("✅ DB connected", {
			host: config.host,
			database: config.database,
			dialect: sequelize.getDialect(),
		});
	});

	// before disconnect
	sequelize.addHook("beforeDisconnect", ({ config }) => {
		console.log("🔌 [beforeDisconnect] Closing DB connection...", config.database);
	});

	// after disconnect
	sequelize.addHook("afterDisconnect", ({ config }) => {
		console.log("❌ [afterDisconnect] DB connection closed.", config.database);
	});

	sequelize.beforeDefine((attributes) => {
		attributes.createdBy = {
			type: DataTypes.STRING,
			allowNull: false,
			defaultValue: "system",
		};
		attributes.updatedBy = {
			type: DataTypes.STRING,
			allowNull: false,
			defaultValue: "system",
		};
		attributes.deletedBy = { type: DataTypes.STRING, allowNull: true };

		attributes.status = {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: true,
			comment: "Active status",
			field: "status",
			validate: {
				notNull: { msg: "Status is required" },
			},
		};
	});

	sequelize.addHook("afterDefine", (model) => {
		console.log(`📦 Model ready: ${model.name}`);
	});

	// 📝 Create/Update unified audit
	sequelize.addHook("beforeSave", (instance) => {
		const who = getCurrentUser();
		if (instance.isNewRecord) {
			instance.createdBy = who;
		}
		instance.updatedBy = who;
	});

	sequelize.addHook("afterSave", (instance) => {
		console.log(`💾 Saved ${instance.constructor.name} [id=${instance.id}]`);
	});

	sequelize.addHook("beforeCreate", (instance) => {
		const who = getCurrentUser();
		instance.createdBy = who;
		instance.updatedBy = who;
	});

	sequelize.addHook("beforeBulkCreate", (instances) => {
		const who = getCurrentUser();
		instances.forEach((instance) => {
			instance.createdBy = who;
			instance.updatedBy = who;
		});
	});

	sequelize.addHook("afterBulkCreate", (instances) => {
		console.log(`📦 Bulk created ${instances.length} rows`);
	});

	sequelize.addHook("beforeUpdate", (instance) => {
		instance.updatedBy = getCurrentUser();
	});

	sequelize.addHook("beforeBulkUpdate", async (options) => {
		options.attributes ??= {};
		options.attributes.updatedBy = getCurrentUser();
	});

	sequelize.addHook("afterBulkUpdate", () => {
		console.log("✏️ Bulk update completed");
	});

	sequelize.addHook("beforeDestroy", async (instance) => {
		instance.deletedBy = getCurrentUser();
		instance.status = false;
		await instance.save({ hooks: false, silent: true });
	});

	sequelize.addHook("beforeBulkDestroy", (options) => {
		options.individualHooks = true;
	});

	sequelize.addHook("afterBulkDestroy", () => {
		console.log("🗑️ Bulk destroy completed");
	});

	sequelize.addHook("afterRestore", async (instance, options) => {
		if (instance.constructor?.options?.paranoid) {
			instance.deletedBy = null;
			instance.updatedBy = getCurrentUser();
			instance.status = true;
			await instance.save({
				hooks: false,
				silent: true,
				transaction: options?.transaction,
			});
		}
	});

	sequelize.addHook("beforeBulkRestore", (options) => {
		options.individualHooks = true;
	});

	sequelize.addHook("afterBulkRestore", () => {
		console.log("♻️ Bulk restore completed");
	});

	if (env.NODE_ENV == "development") {
		sequelize.addHook("afterFind", (result) => {
			console.log(
				`📤 Query returned ${Array.isArray(result) ? result.length : result ? 1 : 0} rows`,
			);
		});
	}
};
