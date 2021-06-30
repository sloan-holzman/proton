const _ = require('lodash');
const { getNumReferencesByBlobStorageId } = require('./get-num-references-by-blob-storage-id');
const { mergeCountsByBlobStorageId } = require('./utils');
const { MAX_ATTEMPTS } = require('./constants');

const getReferencingTablesToQuery = db => db.query('select * from TableReferencesToBlobStorageID');

const getCombinedNumReferencesByBlobStorageId = async ({ db, attempt = 0 }) => {
  try {
    const referencesToQuery = await getReferencingTablesToQuery(db);
    const countsByBlobStorageId = await Promise.all(referencesToQuery.map(referenceRow => getNumReferencesByBlobStorageId({ db, referenceRow })));
    const failedQueries = countsByBlobStorageId.filter(count => !count.succeeded);
    if (!failedQueries.length) {
      await db.release();
      return mergeCountsByBlobStorageId(_.map(countsByBlobStorageId, 'result'));
    }
    if (attempt <= MAX_ATTEMPTS) {
      return getCombinedNumReferencesByBlobStorageId({ db, attempt: attempt + 1 });
    }
    const failingCombinations = failedQueries.map(failedQuery => `tableName: ${failedQuery.referenceRow.tableName} / columnName: ${failedQuery.referenceRow.columnName}`).join(', ');
    throw new Error(`Unable to complete process for the following tables/columns: ${failingCombinations}`);
  } catch (err) {
    await db.release();
    throw err;
  }
};

module.exports = { getCombinedNumReferencesByBlobStorageId };
