// TODO: take into account the two references in global - make a table there, too...make function generic or whatever
// TODO: rename functions, think through keys and mapping
// TODO: set up 'release'
const _ = require('lodash');
const { getCountByBlogStorageId } = require('./get-count-by-blog-storage-id');
const { mergeCountsByBlogStorageId } = require('./utils');
const { MAX_ATTEMPTS } = require('./constants');

const getReferencesToCheck = db => db.query('select * from BlobReferenceCron');

const getCombinedCountByBlogStorageId = async ({ db, attempt = 0 }) => {
  try {
    const referencesToCheck = await getReferencesToCheck(db);
    // TODO: two of these are returning empty objects
    const getCountByStorageIdFromReferencesRow = getCountByBlogStorageId(db);
    const countsByBlogStorageId = await Promise.all(referencesToCheck.map(getCountByStorageIdFromReferencesRow));
    const failedQueries = countsByBlogStorageId.filter(count => !count.succeeded);
    if (!failedQueries.length) {
      await db.release();
      return mergeCountsByBlogStorageId(_.map(countsByBlogStorageId, 'result'));
    }
    if (attempt <= MAX_ATTEMPTS) {
      return getCombinedCountByBlogStorageId({ db, attempt: attempt + 1 });
    }
    const failingCombinations = failedQueries.map(failedQuery => `TableName: ${failedQuery.referenceRow.TableName} / ColumnName: ${failedQuery.referenceRow.ColumnName}`).join(', ');
    throw new Error(`Unable to complete process for the following tables/columns: ${failingCombinations}`);
  } catch (err) {
    await db.release();
    throw err;
  }
};

module.exports = { getCombinedCountByBlogStorageId };
