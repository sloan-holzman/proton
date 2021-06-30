require('dotenv').config();

const {
  DB_HOST,
  DB_USER,
  DB_PASSWORD,
  DB_PROTON_MAIL_GLOBAL,
  DB_PROTON_MAIL_SHARD,
  DB_PORT,
  DB_POOL_LIMIT,
} = process.env;

const db = {
  DB_HOST,
  DB_USER,
  DB_PASSWORD,
  DB_PROTON_MAIL_GLOBAL,
  DB_PROTON_MAIL_SHARD,
  DB_PORT,
  DB_POOL_LIMIT,
};

module.exports = { db };
