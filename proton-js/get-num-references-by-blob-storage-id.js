const { isWithinTimeLimit, mapRowsToCountByBlobStorageID } = require('./utils');

const getNumReferencesGroupedByBlobStorageID = ({ referenceRow, db }) => db.query(`select ${referenceRow.columnName} as "blobStorageId", count(${referenceRow.columnName}) as "numReferences" from ${referenceRow.tableName} group by ${referenceRow.columnName}`);
const updateTableReferencesToBlobStorageIDStartedAt = ({ referenceRow, db }) => db.query('update TableReferencesToBlobStorageID set startedAt = now() where columnName = ? and tableName = ?', [referenceRow.columnName, referenceRow.tableName]);
const updateTableReferencesToBlobStorageIDCountById = ({
  referenceRow, db, countByBlobStorageId,
}) => db.query('update TableReferencesToBlobStorageID set endedAt = now(), countByBlobStorageID = ? where columnName = ? and tableName = ?', [JSON.stringify(countByBlobStorageId), referenceRow.columnName, referenceRow.tableName]);


const getAndSaveCountByBlobStorageId = async ({ referenceRow, db }) => {
  try {
    await db.query('START TRANSACTION');
    await updateTableReferencesToBlobStorageIDStartedAt({ referenceRow, db });
    const numReferencesToEachBlogStorageID = await getNumReferencesGroupedByBlobStorageID({ referenceRow, db });
    const countByBlobStorageId = mapRowsToCountByBlobStorageID(numReferencesToEachBlogStorageID);
    await updateTableReferencesToBlobStorageIDCountById({
      referenceRow, countByBlobStorageId, db,
    });
    await db.query('COMMIT');
    return countByBlobStorageId;
  } catch (err) {
    await db.query('ROLLBACK');
    throw err;
  }
};

const getNumReferencesByBlobStorageId = async ({ db, referenceRow }) => {
  const { endedAt, countByBlobStorageID, columnName, tableName } = referenceRow;
  try {
    if (isWithinTimeLimit(endedAt)) {
      return { succeeded: true, result: JSON.parse(countByBlobStorageID), referenceRow };
    }
    const updatedCountByBlogStorageID = await getAndSaveCountByBlobStorageId({ referenceRow, db });
    return { succeeded: true, result: updatedCountByBlogStorageID, referenceRow };
  } catch (err) {
    console.error(`Error querying for BlobStorageID references for ${columnName}, ${tableName}`, err);
    return { succeeded: false, referenceRow };
  }
};

module.exports = {
  getNumReferencesByBlobStorageId,
};
