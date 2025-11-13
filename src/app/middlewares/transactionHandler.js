import onFinished from "on-finished";

import sequelize from "#app/database/index.js";

export default async function transactionHandler(req, res, next) {
	const transaction = await sequelize.transaction();
	req.transaction = transaction;
	let done = false;
	const finish = async (error) => {
		console.log("✅ Transaction Start");
		if (done) return;
		done = true;
		try {
			if (error || res.statusCode >= 400) {
				await transaction.rollback();
				console.log(`🧾 [TX:${transaction.id}] rolled back`);
			} else {
				await transaction.commit();
				console.log(`✅ [TX:${transaction.id}] committed`);
			}
		} catch (e) {
			console.error("💥 Transaction finalize error:", e.message);
		} finally {
			console.log("✅ Transaction End");
		}
	};

	onFinished(res, finish);
	try {
		await next();
	} catch (error) {
		await finish(error);
		next(error);
	}
}
