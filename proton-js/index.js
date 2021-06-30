const { db } = require('./config');
const { connection } = require('./db');
const { mergeCountsByBlobStorageId } = require('./utils');
const { getBlobStorageIdInconsistenciesByType } = require('./get-blob-storage-id-inconsistencies-by-type');
const { getCombinedReferenceCountsByBlobStorageId } = require('./get-combined-count-by-blob-storage-id');

const identifyDataInconsistencies = async () => {
  const shardDBCountByBlobStorageId = await getCombinedReferenceCountsByBlobStorageId({ db: await connection(db.DB_PROTON_MAIL_SHARD) });
  const globalDBCountByBlobStorageId = await getCombinedReferenceCountsByBlobStorageId({ db: await connection(db.DB_PROTON_MAIL_GLOBAL) });
  return getBlobStorageIdInconsistenciesByType({
    db: await connection(db.DB_PROTON_MAIL_GLOBAL),
    countByBlobStorageId: mergeCountsByBlobStorageId([
      shardDBCountByBlobStorageId,
      globalDBCountByBlobStorageId,
    ]),
  });
};

identifyDataInconsistencies()
  .catch(err => console.error('Error running query', err));
