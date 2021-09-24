import { Sequelize } from 'sequelize';
import allConfig from '../config/config.js';

import gameModel from './game.mjs';

const env = process.env.NODE_ENV || 'development';

const config = allConfig[env];

const db = {};

const sequelize = new Sequelize(config.database, config.username, config.password, config);

// add your model definitions to db here
db.Game = gameModel(sequelize, Sequelize.DataTypes);

sequelize.sync()
  .then(() => {
    db.sequelize = sequelize;
    db.Sequelize = Sequelize;
  })
  .catch((err) => console.log(err));

export default db;
