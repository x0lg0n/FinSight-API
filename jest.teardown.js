require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.test' });
require('ts-node/register');

const { closeDatabase } = require('./src/config/database');

module.exports = async () => {
  await closeDatabase();
};