import { readdirSync } from "fs";

export default async (sequelize) => {
	const models = {};
	const files = readdirSync("src/models").filter(
		(file) => file !== "index.js" && file.endsWith(".model.js"),
	);

	for (const file of files) {
		const defineModel = (await import(`#src/models/${file}`)).default;
		if (!defineModel) {
			continue;
		}
		const model = defineModel(sequelize);
		models[model.name] = model;
	}

	for (const model of Object.values(models)) {
		if (typeof model.associate === "function") {
			model.associate(models);
		}
	}

	console.log(`✅ Loaded ${Object.keys(models).length} models.`);
	return models;
};
