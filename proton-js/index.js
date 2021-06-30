const { db } = require('./config');
const { connection } = require('./db');
const { mergeCountsByBlobStorageId } = require('./utils');
const { getBlobStorageIdInconsistenciesByType } = require('./get-blob-storage-id-inconsistencies-by-type');
const { getCombinedNumReferencesByBlobStorageId } = require('./get-combined-num-references-by-blob-storage-id');

const identifyDataInconsistencies = async () => {
  const shardDBCountByBlobStorageId = await getCombinedNumReferencesByBlobStorageId({ db: await connection(db.DB_PROTON_MAIL_SHARD) });
  const globalDBCountByBlobStorageId = await getCombinedNumReferencesByBlobStorageId({ db: await connection(db.DB_PROTON_MAIL_GLOBAL) });
  return getBlobStorageIdInconsistenciesByType({
    db: await connection(db.DB_PROTON_MAIL_GLOBAL),
    countByBlobStorageId: mergeCountsByBlobStorageId([
      shardDBCountByBlobStorageId,
      globalDBCountByBlobStorageId,
    ]),
  });
};

identifyDataInconsistencies()
  .then((result) => {
    console.log('result', result);
    return result;
  })
  .catch(err => console.error('Error running query', err));
