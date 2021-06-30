// TODO: take into account the two references in global - make a table there, too...make function generic or whatever
// TODO: rename functions, think through keys and mapping
// TODO: set up 'release'
const { isWithinTimeLimit, mapBlobStorageIdToCountByBlobStorageID } = require('./utils');

const getReferenceCount = ({ referenceRow, db }) => db.query(`select ${referenceRow.columnName} as "blobStorageId", count(${referenceRow.columnName}) as "numReferences" from ${referenceRow.tableName} group by ${referenceRow.columnName}`);
const updateRecentReferenceCronCountStartedAt = ({ referenceRow, db }) => db.query('update TableReferencesToBlobStorageID set startedAt = now() where columnName = ? and tableName = ?', [referenceRow.columnName, referenceRow.tableName]);
const updateRecentReferenceCronCountCountById = ({
  referenceRow, db, countByBlobStorageId,
}) => db.query('update TableReferencesToBlobStorageID set endedAt = now(), countByBlobStorageID = ? where columnName = ? and tableName = ?', [JSON.stringify(countByBlobStorageId), referenceRow.columnName, referenceRow.tableName]);


const getAndSaveCountByBlobStorageId = async ({ referenceRow, db }) => {
  try {
    await db.query('START TRANSACTION');
    await updateRecentReferenceCronCountStartedAt({ referenceRow, db });
    const references = await getReferenceCount({ referenceRow, db });
    const countByBlobStorageId = mapBlobStorageIdToCountByBlobStorageID(references);
    await updateRecentReferenceCronCountCountById({
      referenceRow, countByBlobStorageId, db,
    });
    await db.query('COMMIT');
    return countByBlobStorageId;
  } catch (err) {
    await db.query('ROLLBACK');
  }
};

const getCountByBlobStorageId = db => async (referenceRow) => {
  const { endedAt, countByBlobStorageID } = referenceRow;
  try {
    if (isWithinTimeLimit(endedAt)) {
      return { succeeded: true, result: JSON.parse(countByBlobStorageID), referenceRow };
    }
    const countByBlobStorageId = await getAndSaveCountByBlobStorageId({ referenceRow, db });
    return { succeeded: true, result: countByBlobStorageId, referenceRow };
  } catch (err) {
    console.error(`Error blah for ${referenceRow.columnName}, ${referenceRow.tableName}`, err);
    return { succeeded: false, referenceRow };
  }
};

module.exports = {
  getCountByBlobStorageId,
};
