const { db } = require('./config');
const { connection } = require('./db');
const { mergeCountsByBlobStorageId } = require('./utils');
const { getBlobStorageIdInconsistenciesByType } = require('./get-blob-storage-id-inconsistencies-by-type');
const { getCombinedReferenceCountsByBlobStorageId } = require('./get-combined-count-by-blob-storage-id');

const identifyDataInconsistencies = async () => {
  const sharedCountByBlobStorageId = await getCombinedReferenceCountsByBlobStorageId({ db: await connection(db.DB_PROTON_MAIL_SHARD) });
  const globalCountByBlobStorageId = await getCombinedReferenceCountsByBlobStorageId({ db: await connection(db.DB_PROTON_MAIL_GLOBAL) });
  const countByBlobStorageId = mergeCountsByBlobStorageId([
    sharedCountByBlobStorageId,
    globalCountByBlobStorageId,
  ]);
  return getBlobStorageIdInconsistenciesByType({
    db: await connection(db.DB_PROTON_MAIL_GLOBAL),
    countByBlobStorageId,
  });
};

identifyDataInconsistencies().then((result) => {
  console.log('BadReferencesByType', result);
});
