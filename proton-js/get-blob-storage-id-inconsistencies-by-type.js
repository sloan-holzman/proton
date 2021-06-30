const _ = require('lodash');
const { MAX_ATTEMPTS } = require('./constants');
const { isWithinTimeLimit } = require('./utils');

const getMostRecentReferenceCountUpdate = db => db.query('select * from BlobReferenceCountRuns order by endedAt desc limit 1');

const getOrphanBlobStorageIDs = async (db) => {
  const orphanBlobStorageIDs = await db.query('select BlobStorageID from BlobStorage where BlobStorageID not in (select BlobStorageID from BlobReferenceCount) and NumReferences > 0');
  return _.map(orphanBlobStorageIDs, 'BlobStorageID');
};

const getMissingBlobStorageIDs = async (db) => {
  const missingBlobStorageIDs = await db.query('select BlobStorageID from BlobReferenceCount where BlobStorageID not in (select BlobStorageID from BlobStorage)');
  return _.map(missingBlobStorageIDs, 'BlobStorageID');
};

const getBlobStoreIDsWithBadCounts = async (db) => {
  const blobStoreIDsWithBadCounts = await db.query('select BlobStorage.BlobStorageId from BlobStorage join BlobReferenceCount on BlobStorage.BlobStorageId = BlobReferenceCount.BlobStorageId where BlobStorage.BlobStorageId != BlobReferenceCount.BlobStorageId');
  return _.map(blobStoreIDsWithBadCounts, 'BlobStorageID');
};

const updateBlobReferenceCounts = async ({ db, countByBlobStorageId }) => {
  try {
    await db.query('START TRANSACTION');
    const startedAt = new Date();
    await db.query('delete from BlobReferenceCount');
    if (!_.isEmpty(countByBlobStorageId)) {
      await db.query(`insert into BlobReferenceCount (BlobStorageID, NumReferences) values ${Object.entries(countByBlobStorageId).map(([BlobStorageID, NumReferences]) => `(${BlobStorageID}, ${NumReferences})`).join(', ')}`);
    }
    await db.query('insert into BlobReferenceCountRuns (startedAt, endedAt) values (?, now())', [startedAt]);
    await db.query('COMMIT');
  } catch (err) {
    await db.query('ROLLBACK');
  }
};


const updateBlobReferenceCountsIfNecessary = async ({ db, countByBlobStorageId }) => {
  const [mostRecentRun] = await getMostRecentReferenceCountUpdate(db);
  if (!mostRecentRun || !isWithinTimeLimit(mostRecentRun.endedAt)) {
    await updateBlobReferenceCounts({ db, countByBlobStorageId });
  }
};

const getBlobStorageIdInconsistenciesByType = async ({ db, countByBlobStorageId, attempt = 0 }) => {
  try {
    await updateBlobReferenceCountsIfNecessary({ db, countByBlobStorageId });
    const [
      orphanBlobStorageIDs,
      missingBlobStorageIDs,
      blobStoreIDsWithBadCounts,
    ] = await Promise.all([
      getOrphanBlobStorageIDs(db),
      getMissingBlobStorageIDs(db),
      getBlobStoreIDsWithBadCounts(db),
    ]);
    await db.release();
    return {
      orphanBlobStorageIDs,
      missingBlobStorageIDs,
      blobStoreIDsWithBadCounts,
    };
  } catch (err) {
    if (attempt <= MAX_ATTEMPTS) {
      return getBlobStorageIdInconsistenciesByType({
        db,
        countByBlobStorageId,
        attempt: attempt + 1,
      });
    }
    await db.release();
    throw err;
  }
};


module.exports = {
  getBlobStorageIdInconsistenciesByType,
};
