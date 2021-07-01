const _ = require('lodash');
const { ACCEPTABLE_TIME_LIMIT_IN_MINUTES } = require('./constants');

const timeLimitInMilliseconds = 1000 * 60 * ACCEPTABLE_TIME_LIMIT_IN_MINUTES;

// TODO: add tests to check that date is a valid data
const isWithinTimeLimit = (date) => {
  if (!date) {
    return false;
  }
  const elapsedTimeInMilliseconds = (new Date().getTime() - new Date(date));
  return elapsedTimeInMilliseconds < timeLimitInMilliseconds;
};

const mergeCountFn = (countA, countB) => (countA || 0) + (countB || 0);

const mergeCountsByBlobStorageId = countsByBlobStorageId => _.mergeWith({}, ...countsByBlobStorageId, mergeCountFn);

const mapRowsToCountByBlobStorageID = numReferencesToEachBlogStorageID => numReferencesToEachBlogStorageID.reduce((acc, reference) => {
  const { blobStorageId, numReferences } = reference;
  acc[blobStorageId] = numReferences;
  return acc;
}, {});


module.exports = {
  isWithinTimeLimit,
  mergeCountsByBlobStorageId,
  mapRowsToCountByBlobStorageID,
};
