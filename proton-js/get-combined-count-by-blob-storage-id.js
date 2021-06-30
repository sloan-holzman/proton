// TODO: take into account the two references in global - make a table there, too...make function generic or whatever
// TODO: rename functions, think through keys and mapping
// TODO: set up 'release'
const _ = require('lodash');
const { getCountByBlobStorageId } = require('./get-count-by-blob-storage-id');
const { mergeCountsByBlobStorageId } = require('./utils');
const { MAX_ATTEMPTS } = require('./constants');

const getReferencingTablesToQuery = db => db.query('select * from TableReferencesToBlobStorageID');

const getCombinedReferenceCountsByBlobStorageId = async ({ db, attempt = 0 }) => {
  try {
    const referencesToQuery = await getReferencingTablesToQuery(db);
    const getCountByStorageIdFromReferencesRow = getCountByBlobStorageId(db);
    const countsByBlobStorageId = await Promise.all(referencesToQuery.map(getCountByStorageIdFromReferencesRow));
    const failedQueries = countsByBlobStorageId.filter(count => !count.succeeded);
    if (!failedQueries.length) {
      await db.release();
      return mergeCountsByBlobStorageId(_.map(countsByBlobStorageId, 'result'));
    }
    if (attempt <= MAX_ATTEMPTS) {
      return getCombinedReferenceCountsByBlobStorageId({ db, attempt: attempt + 1 });
    }
    const failingCombinations = failedQueries.map(failedQuery => `tableName: ${failedQuery.referenceRow.tableName} / columnName: ${failedQuery.referenceRow.columnName}`).join(', ');
    throw new Error(`Unable to complete process for the following tables/columns: ${failingCombinations}`);
  } catch (err) {
    await db.release();
    throw err;
  }
};

module.exports = { getCombinedReferenceCountsByBlobStorageId };
