const { connection } = require('./db');
const { mergeCountsByBlobStorageId } = require('./utils');
const { getBlobStorageIdInconsistenciesByType } = require('./get-blob-storage-id-inconsistencies-by-type');
const { getCombinedNumReferencesByBlobStorageId } = require('./get-combined-num-references-by-blob-storage-id');
const { SHARD, GLOBAL } = require('./constants')

const identifyDataInconsistencies = async () => {
  const shardDBCountByBlobStorageId = await getCombinedNumReferencesByBlobStorageId({ db: await connection(SHARD) });
  const globalDBCountByBlobStorageId = await getCombinedNumReferencesByBlobStorageId({ db: await connection(GLOBAL) });
  return getBlobStorageIdInconsistenciesByType({
    db: await connection(GLOBAL),
    countByBlobStorageId: mergeCountsByBlobStorageId([
      shardDBCountByBlobStorageId,
      globalDBCountByBlobStorageId,
    ]),
  });
};

module.exports = identifyDataInconsistencies

if (require.main === module) {
  identifyDataInconsistencies();
}
