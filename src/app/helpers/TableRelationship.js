export default function (sequelize) {
	let count = 0;

	// Column headers and widths
	const headers = {
		sr: "Sr",
		model: "Model Name",
		table: "Table Name",
		relation: "Relationships",
	};
	const widths = { sr: 4, model: 20, table: 20, relation: 50 };

	const pad = (text, width) => String(text).padEnd(width, " ");
	const divider = "-".repeat(
		widths.sr + widths.model + widths.table + widths.relation + 9,
	);

	// Print header
	console.log(`📦 Sequelize Model Associations`);
	console.log(divider);
	console.log(
		`${pad(headers.sr, widths.sr)} | ${pad(headers.model, widths.model)} | ` +
			`${pad(headers.table, widths.table)} | ${pad(headers.relation, widths.relation)}`,
	);
	console.log(divider);

	// Print each model’s associations
	for (const [modelName, model] of Object.entries(sequelize.models)) {
		const tableName = model.getTableName();
		const associations = Object.values(model.associations || {});

		const relations = associations.map((assoc) => {
			const target = assoc.target?.name || "Unknown";
			let desc = "?";

			switch (assoc.associationType) {
				case "HasOne":
					desc = `1:1 → ${target}`;
					break;

				case "BelongsTo": {
					// check if non-nullable to distinguish 1:1 vs 0:1
					const allowNull = model.rawAttributes?.[assoc.foreignKey]?.allowNull;
					desc = `${allowNull === false ? "1:1" : "0:1"} → ${target}`;
					break;
				}

				case "HasMany":
					desc = `1:M → ${target}`;
					break;

				case "BelongsToMany": {
					// Pull the join model name
					const throughModel =
						assoc.through?.model?.name ||
						assoc.through?.modelName ||
						assoc.throughModel?.name ||
						"JoinModel";
					desc = `M:N → ${target} (through ${throughModel})`;
					break;
				}
			}

			return desc;
		});

		const relationList = relations.length ? relations.join(", ") : "None";

		console.log(
			`${pad(++count + ".", widths.sr)} | ${pad(modelName, widths.model)} | ` +
				`${pad(tableName, widths.table)} | ${pad(relationList, widths.relation)}`,
		);
	}
	console.log(divider);
}
