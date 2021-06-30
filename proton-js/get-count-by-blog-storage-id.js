// TODO: take into account the two references in global - make a table there, too...make function generic or whatever
// TODO: rename functions, think through keys and mapping
// TODO: set up 'release'
const { isWithinTimeLimit, mapBlogStorageIdToCountByBlogStorageID } = require('./utils');

const getReferenceCount = ({ referenceRow, db }) => db.query(`select ${referenceRow.ColumnName} as "blobStorageId", count(${referenceRow.ColumnName}) as "numReferences" from ${referenceRow.TableName} group by ${referenceRow.ColumnName}`);
const updateRecentReferenceCronCountStartedAt = ({ referenceRow, db }) => db.query('update BlobReferenceCron set StartedAt = now() where ColumnName = ? and TableName = ?', [referenceRow.ColumnName, referenceRow.TableName]);
const updateRecentReferenceCronCountCountById = ({
  referenceRow, db, countByBlogStorageId,
}) => db.query('update BlobReferenceCron set EndedAt = now(), CountByBlobStorageId = ? where ColumnName = ? and TableName = ?', [JSON.stringify(countByBlogStorageId), referenceRow.ColumnName, referenceRow.TableName]);


const getCountByBlogStorageId = db => async (referenceRow) => {
  const { EndedAt, CountByBlobStorageID } = referenceRow;
  try {
    if (isWithinTimeLimit(EndedAt)) {
      return { succeeded: true, result: JSON.parse(CountByBlobStorageID), referenceRow };
    }
    // TODO: wrap in a transaction
    await updateRecentReferenceCronCountStartedAt({ referenceRow, db });
    const references = await getReferenceCount({ referenceRow, db });
    const countByBlogStorageId = mapBlogStorageIdToCountByBlogStorageID(references);
    await updateRecentReferenceCronCountCountById({
      referenceRow, countByBlogStorageId, db,
    });
    return { succeeded: true, result: countByBlogStorageId, referenceRow };
  } catch (err) {
    console.error(`Error blah for ${referenceRow.ColumnName}, ${referenceRow.TableName}`, err);
    return { succeeded: false, referenceRow };
  }
};

module.exports = {
  getCountByBlogStorageId,
};
