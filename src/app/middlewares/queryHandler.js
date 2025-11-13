import { Op } from "sequelize";

import { tables } from "#db/index.js";

/**
 * Generic, future-proof Sequelize query builder middleware.
 * Handles filters, pagination, associations, and tenant (siteId) isolation.
 */
class WhereBuilder {
	constructor(models = tables) {
		this.models = models;
		this.where = {};
		this.include = [];
		this.active = true;
		this.offset = 0;
		this.limit = null;
		this.order = [["createdAt", "DESC"]];
		this.raw = false;
		this.attributes = undefined;
		this.group = undefined;
		this.havingClause = undefined;
		this.scopeNames = [];
		this.model = undefined; // set automatically on find calls
	}

	// ---------- TENANT FILTERS ----------

	/**
	 * Multi-tenant filter:
	 *  - Normal user → only their own site
	 *  - Admin (no siteId) + ?siteId=... → that site
	 *  - Admin (no siteId, no query param) → all sites
	 */
	site(req, model) {
		if (!req) return this;

		const userSiteId = req.user?.siteId ?? null;
		const querySiteId = req.query?.siteId ?? null;
		let finalSiteId = null;

		if (userSiteId !== null) finalSiteId = userSiteId;
		else if (querySiteId) finalSiteId = querySiteId;

		if (finalSiteId === null) return this;

		const targetModel = model || this.model;
		if (targetModel?.rawAttributes && !targetModel.rawAttributes.siteId) return this;

		this.equal("siteId", finalSiteId, targetModel);
		return this;
	}

	// ---------- BASIC FILTERS ----------

	equal(key, value, model) {
		if (value === undefined || value === null || value === "") {
			if (key.includes(".")) this._ensureInclude(key.split(".")[0], model);
			return this;
		}

		const targetModel = model || this.model;
		if (
			targetModel?.rawAttributes &&
			!targetModel.rawAttributes[key] &&
			!key.includes(".")
		) {
			console.warn(
				`[WhereBuilder] skipped invalid column '${key}' on model '${targetModel?.name}'`,
			);
			return this;
		}

		this._applyKey(key, { [Op.eq]: value }, model);
		return this;
	}

	notEqual(key, value, model) {
		if (value !== undefined && value !== null && value !== "")
			this._applyKey(key, { [Op.ne]: value }, model);
		return this;
	}

	like(key, value, model) {
		if (value) this._applyKey(key, { [Op.like]: `%${value}%` }, model);
		else if (key.includes(".")) this._ensureInclude(key.split(".")[0], model);
		return this;
	}

	ilike(key, value, model) {
		if (value) this._applyKey(key, { [Op.iLike]: `%${value}%` }, model);
		else if (key.includes(".")) this._ensureInclude(key.split(".")[0], model);
		return this;
	}

	in(key, values = [], model) {
		if (Array.isArray(values) && values.length)
			this._applyKey(key, { [Op.in]: values }, model);
		return this;
	}

	notIn(key, values = [], model) {
		if (Array.isArray(values) && values.length)
			this._applyKey(key, { [Op.notIn]: values }, model);
		return this;
	}

	between(key, from, to, model) {
		if (from && to) this._applyKey(key, { [Op.between]: [from, to] }, model);
		return this;
	}

	gt(key, value, model) {
		if (value !== undefined && value !== null && value !== "") {
			this._applyKey(key, { [Op.gt]: value }, model);
		}
		return this;
	}

	lt(key, value, model) {
		if (value !== undefined && value !== null && value !== "") {
			this._applyKey(key, { [Op.lt]: value }, model);
		}
		return this;
	}

	gte(key, value, model) {
		if (value) this._applyKey(key, { [Op.gte]: value }, model);
		return this;
	}

	lte(key, value, model) {
		if (value) this._applyKey(key, { [Op.lte]: value }, model);
		return this;
	}

	or(conditions = []) {
		this.where[Op.or] = conditions;
		return this;
	}

	and(conditions = []) {
		this.where[Op.and] = conditions;
		return this;
	}

	// ---------- META / PAGINATION ----------

	status(status) {
		if (status == 1 || status === true || status === "true") {
			this.where.deletedAt = { [Op.is]: null };
			this.active = true;
		} else if (status == 0 || status === false || status === "false") {
			this.where.deletedAt = { [Op.not]: null };
			this.active = false;
		} else {
			this.active = false;
		}
		return this;
	}

	paginate(offset = 0, limit) {
		this.offset = Math.max(0, parseInt(offset, 10) || 0);
		this.limit = limit && !isNaN(limit) ? Math.max(1, parseInt(limit, 10)) : null;
		return this;
	}

	orderBy(column = "createdAt", direction = "DESC") {
		if (column) this.order.unshift([column, direction.toUpperCase()]);
		return this;
	}

	groupBy(columns = []) {
		this.group = Array.isArray(columns) ? columns : [columns];
		return this;
	}

	having(conditions = {}) {
		this.havingClause = conditions;
		return this;
	}

	scope(...scopes) {
		this.scopeNames = scopes;
		return this;
	}

	setRaw(raw = true) {
		this.raw = raw;
		return this;
	}

	setAttributes(attrs = []) {
		this.attributes = Array.isArray(attrs) ? attrs : undefined;
		return this;
	}

	// ---------- INCLUDE HANDLING ----------

	includeModel(as, model, opts = {}) {
		let includeObj = this.include.find((i) => i.as === as);
		if (!includeObj) {
			const targetModel = model || this.models[as];
			if (!targetModel) throw new Error(`Model not found for association: ${as}`);
			includeObj = { model: targetModel, as, required: false, where: {}, ...opts };
			this.include.push(includeObj);
		} else {
			Object.assign(includeObj, opts);
		}
		return this;
	}

	// ---------- INTERNAL HELPERS ----------

	/**
	 * Applies a filter condition to key or association.
	 * Association filters are converted to $alias.field$ form
	 * to avoid Sequelize INNER JOINs on include.where.
	 */
	_applyKey(key, condition, model) {
		const parts = key.split(".");

		// simple field
		if (parts.length === 1) {
			const [field] = parts;
			this.where[field] = { ...(this.where[field] || {}), ...condition };
			return;
		}

		// association.field → use $alias.field$
		const [association, field] = parts;
		const virtualKey = `$${association}.${field}$`;
		this.where[virtualKey] = { ...(this.where[virtualKey] || {}), ...condition };
		this._ensureInclude(association, model);
	}

	_applyNestedInclude(parts, condition, model) {
		const [association, ...rest] = parts;
		const field = rest.pop();
		const targetModel = model || this.models[association];
		if (!targetModel) throw new Error(`Model not found for association: ${association}`);

		let includeObj = this.include.find((i) => i.as === association);
		if (!includeObj) {
			includeObj = { model: targetModel, as: association, include: [], where: {} };
			this.include.push(includeObj);
		}

		let current = includeObj;
		for (const nextAs of rest) {
			let child = current.include.find((x) => x.as === nextAs);
			if (!child) {
				const nextModel = this.models[nextAs];
				if (!nextModel) throw new Error(`Model not found: ${nextAs}`);
				child = { model: nextModel, as: nextAs, include: [], where: {} };
				current.include.push(child);
			}
			current = child;
		}
		current.where[field] = { ...(current.where[field] || {}), ...condition };
	}

	_ensureInclude(association, model) {
		if (!association) return;
		let includeObj = this.include.find((i) => i.as === association);
		if (!includeObj) {
			const targetModel = model || this.models[association];
			if (!targetModel)
				throw new Error(`Model not found for association: ${association}`);
			includeObj = { model: targetModel, as: association, required: false };
			this.include.push(includeObj);
		}
	}

	// ---------- DYNAMIC QUERY PARSER ----------

	parseFromQuery(queryObj = {}) {
		for (const [rawKey, value] of Object.entries(queryObj)) {
			const [key, op] = rawKey.split("__");
			if (!key || value === undefined || value === null) continue;

			switch (op) {
				case "eq":
					this.equal(key, value);
					break;
				case "ne":
					this.notEqual(key, value);
					break;
				case "like":
					this.like(key, value);
					break;
				case "ilike":
					this.ilike(key, value);
					break;
				case "notLike":
					this._applyKey(key, { [Op.notLike]: `%${value}%` });
					break;
				case "in":
					this.in(key, value.split(","));
					break;
				case "notIn":
					this.notIn(key, value.split(","));
					break;
				case "between": {
					const [from, to] = value.split(",");
					this.between(key, from, to);
					break;
				}
				case "gt":
					this.gt(key, value);
					break;
				case "lt":
					this.lt(key, value);
					break;
				case "gte":
					this.gte(key, value);
					break;
				case "lte":
					this.lte(key, value);
					break;
				default:
					this.equal(key, value);
			}
		}
		return this;
	}

	// ---------- OUTPUT BUILDERS ----------

	toJSON() {
		return { where: this.where };
	}

	toQueryOptions() {
		return {
			...this.toJSON(),
			order: this.order,
			limit: this.limit,
			offset: this.offset,
			paranoid: this.active,
			include: this.include.length ? this.include : undefined,
			raw: this.raw,
			attributes: this.attributes || { exclude: ["deletedAt"] },
			group: this.group,
			having: this.havingClause,
		};
	}

	// ---------- EXECUTION ----------

	async findAll(model) {
		if (!model) throw new Error("Model is required for findAll()");
		this.model = model;
		return this.scopeNames.length
			? model.scope(this.scopeNames).findAll(this.toQueryOptions())
			: model.findAll(this.toQueryOptions());
	}

	async findAndCountAll(model) {
		if (!model) throw new Error("Model is required for findAndCountAll()");
		this.model = model;
		return this.scopeNames.length
			? model.scope(this.scopeNames).findAndCountAll(this.toQueryOptions())
			: model.findAndCountAll(this.toQueryOptions());
	}
}

// ---------- EXPRESS MIDDLEWARE ----------
export default (req, res, next) => {
	req.queryBuilder = new WhereBuilder();
	next();
};

export { WhereBuilder };
