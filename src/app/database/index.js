import { Sequelize } from "sequelize";

import dbConfig from "#db/configs.js";
import hooks from "#db/hooks.js";
import models from "#db/models.js";

const sequelize = new Sequelize(dbConfig);
await hooks(sequelize);
export const tables = await models(sequelize);
export default sequelize;
