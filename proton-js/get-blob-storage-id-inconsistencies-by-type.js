const _ = require('lodash');
const { MAX_ATTEMPTS } = require('./constants');
const { isWithinTimeLimit } = require('./utils');

const mapForBlobStorageID = rows => rows.map(row => row.BlobStorageID);

const getMostRecentReferenceCountUpdate = db => db.query('select * from BlobReferenceCountRuns order by endedAt desc limit 1');

const getOrphanBlobStorageIDs = async (db) => {
  const orphanBlobStorageIDs = await db.query('select BlobStorageID from BlobStorage where BlobStorageID not in (select BlobStorageID from BlobReferenceCount) and NumReferences > 0');
  return mapForBlobStorageID(orphanBlobStorageIDs);
};

const getMissingBlobStorageIDs = async (db) => {
  const missingBlobStorageIDs = await db.query('select BlobStorageID from BlobReferenceCount where BlobStorageID not in (select BlobStorageID from BlobStorage)');
  return mapForBlobStorageID(missingBlobStorageIDs);
};

const getBlobStoreIDsWithBadCounts = async (db) => {
  const blobStoreIDsWithBadCounts = await db.query('select BlobStorage.BlobStorageId from BlobStorage join BlobReferenceCount on BlobStorage.BlobStorageId = BlobReferenceCount.BlobStorageId where BlobStorage.BlobStorageId != BlobReferenceCount.BlobStorageId');
  return mapForBlobStorageID(blobStoreIDsWithBadCounts);
};

const updateBlobReferenceCounts = async ({ db, countByBlobStorageId }) => {
  try {
    const startedAt = new Date();
    await db.query('START TRANSACTION');
    await db.query('delete from BlobReferenceCount');
    if (!_.isEmpty(countByBlobStorageId)) {
      const values = Object.entries(countByBlobStorageId)
        .map(([BlobStorageID, NumReferences]) => `(${BlobStorageID}, ${NumReferences})`)
        .join(', ');
      await db.query(`insert into BlobReferenceCount (BlobStorageID, NumReferences) values ${values}`);
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

// TODO: abstract out max_attempts/retry logic to make it generically reusable
const getBlobStorageIdInconsistenciesByType = async ({ db, countByBlobStorageId, attempt = 0 }) => {
  try {
    await updateBlobReferenceCountsIfNecessary({ db, countByBlobStorageId });
    /* TODO:
        for increased resiliency, for three queries below
        I could save most recent result of query in DB,
        only query if last query was outside of time limit,
        and add try/catch recursion for multiple attempts if there is a failure.
        see 'getNumReferencesByBlobStorageID' as an example
     */
    const [
      orphanBlobStorageIDs,
      missingBlobStorageIDs,
      blobStoreIDsWithBadCounts,
    ] = await Promise.all([
      getOrphanBlobStorageIDs(db),
      getMissingBlobStorageIDs(db),
      getBlobStoreIDsWithBadCounts(db),
    ]);
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
    throw err;
  } finally {
    await db.release();
  }
};


module.exports = {
  getBlobStorageIdInconsistenciesByType,
};
