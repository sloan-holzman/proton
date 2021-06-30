// NOTE: the below code was adapted from https://medium.com/wenchin-rolls-around/example-of-using-transactions-with-async-await-via-mysql-connection-pool-9a37092f226f
const mysql = require('mysql');
const { db } = require('../config');

const {
  DB_USER, DB_PASSWORD, DB_HOST, DB_POOL_LIMIT, DB_PROTON_MAIL_SHARD, DB_PROTON_MAIL_GLOBAL,
} = db;

const dbConfig = {
  connectionLimit: DB_POOL_LIMIT,
  host: DB_HOST,
  user: DB_USER,
  password: DB_PASSWORD,
};

const pools = {
  [DB_PROTON_MAIL_SHARD]: mysql.createPool({ ...dbConfig, database: DB_PROTON_MAIL_SHARD }),
  [DB_PROTON_MAIL_GLOBAL]: mysql.createPool({ ...dbConfig, database: DB_PROTON_MAIL_GLOBAL }),
};

// simply function to 'promisify' getting connections and making queries
const connection = database => new Promise((resolve, reject) => {
  pools[database].getConnection((err, con) => {
    if (err) reject(err);

    const query = (sql, values) => new Promise((res, rej) => {
      con.query(sql, values, (error, result) => {
        if (error) rej(error);
        res(result);
      });
    });

    const release = () => new Promise((res, rej) => {
      if (err) rej(err);
      res(con.release());
    });

    resolve({ query, release });
  });
});

module.exports = { connection };
