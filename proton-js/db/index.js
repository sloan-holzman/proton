// NOTE: the code below was adapted from https://medium.com/wenchin-rolls-around/example-of-using-transactions-with-async-await-via-mysql-connection-pool-9a37092f226f
const mysql = require('mysql');
const {
  DB_USER, DB_PASSWORD, DB_HOST, DB_POOL_LIMIT, DB_PROTON_MAIL_SHARD, DB_PROTON_MAIL_GLOBAL,
} = require('../config');

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


const connection = database => new Promise((resolve, reject) => {
  pools[database].getConnection((err, con) => {
    if (err) reject(err);

    const query = (sql, binding) => new Promise((res, rej) => {
      con.query(sql, binding, (error, result) => {
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

const query = (database, sql, binding) => new Promise((resolve, reject) => {
  pools[database].query(sql, binding, (err, result) => {
    if (err) reject(err);
    resolve(result);
  });
});

module.exports = { pools, connection, query };
