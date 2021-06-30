const _ = require('lodash');


// TODO: make it a transaction ?  add recursion ?
const getBadReferencesByType = async ({ db, countByBlogStorageId }) => {
  try {
    await db.query('delete from BlobReferenceCount');
    await db.query(`insert into BlobReferenceCount (BlobStorageID, NumReferences) values ${Object.entries(countByBlogStorageId).map(([BlobStorageID, NumReferences]) => `(${BlobStorageID}, ${NumReferences})`).join(', ')}`);
    const orphanBlobStorageID = await db.query('select BlobStorageID from BlobStorage where BlobStorageID not in (select BlobStorageID from BlobReferenceCount) and NumReferences > 0');
    const referencesToMissingBlobs = await db.query('select BlobStorageID from BlobReferenceCount where BlobStorageID not in (select BlobStorageID from BlobStorage)');
    const countMismatches = await db.query('select BlobStorage.BlobStorageId from BlobStorage join BlobReferenceCount on BlobStorage.BlobStorageId = BlobReferenceCount.BlobStorageId where BlobStorage.BlobStorageId != BlobReferenceCount.BlobStorageId', [], row => row.BlobStorageID);
    await db.release();
    return {
      orphanBlobStorageID: _.map(orphanBlobStorageID, 'BlobStorageID'),
      referencesToMissingBlobs: _.map(referencesToMissingBlobs, 'BlobStorageID'),
      countMismatches: _.map(countMismatches, 'BlobStorageID'),
    };
  } catch (err) {
    await db.release();
    throw err;
  }
};


module.exports = {
  getBadReferencesByType,
};
