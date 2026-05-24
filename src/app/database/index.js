import { Sequelize } from "sequelize";

import dbConfig from "./configs.js";
import hooks from "./hooks.js";
import models from "./models.js";

const sequelize = new Sequelize(dbConfig);
await hooks(sequelize);
export const tables = await models(sequelize);
Object.freeze(tables);
export default sequelize;
