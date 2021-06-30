require('dotenv').config();

// TODO: change exports to all but under the key DB
const {
  DB_HOST,
  DB_USER,
  DB_PASSWORD,
  DB_PROTON_MAIL_GLOBAL,
  DB_PROTON_MAIL_SHARD,
  DB_PORT,
  DB_POOL_LIMIT,
} = process.env;


module.exports = {
  DB_HOST,
  DB_PASSWORD,
  DB_USER,
  DB_PORT,
  DB_PROTON_MAIL_GLOBAL,
  DB_PROTON_MAIL_SHARD,
  DB_POOL_LIMIT,
};
