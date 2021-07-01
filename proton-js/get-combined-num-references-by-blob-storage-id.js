const { getNumReferencesByBlobStorageID } = require('./get-num-references-by-blob-storage-id');
const { mergeCountsByBlobStorageId } = require('./utils');
const { MAX_ATTEMPTS } = require('./constants');

// returns a row for each tables/column combination that reference BlobStorageID,
// as well the most recent query result against each combination
const getReferencingTablesToQuery = db => db.query('select * from TableReferencesToBlobStorageID');

// TODO: abstract out max_attempts/retry logic to make it generically reusable
const getCombinedNumReferencesByBlobStorageId = async ({ db, attempt = 0 }) => {
  try {
    const referencesToQuery = await getReferencingTablesToQuery(db);
    const countsByBlobStorageId = await Promise.all(
      referencesToQuery
        .map(referenceRow => getNumReferencesByBlobStorageID({ db, referenceRow })),
    );
    const failedQueries = countsByBlobStorageId.filter(count => !count.succeeded);
    if (!failedQueries.length) {
      const mappedResults = countsByBlobStorageId.map(count => count.result);
      return mergeCountsByBlobStorageId(mappedResults);
    }
    if (attempt <= MAX_ATTEMPTS) {
      return getCombinedNumReferencesByBlobStorageId({ db, attempt: attempt + 1 });
    }
    const failingCombinations = failedQueries
      .map(failedQuery => `tableName: ${failedQuery.referenceRow.tableName} / columnName: ${failedQuery.referenceRow.columnName}`)
      .join(', ');
    throw new Error(`Unable to complete process for the following tables/columns: ${failingCombinations}`);
  } catch (err) {
    throw err;
  } finally {
    await db.release();
  }
};

module.exports = { getCombinedNumReferencesByBlobStorageId };
