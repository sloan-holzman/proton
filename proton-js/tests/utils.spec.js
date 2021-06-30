const {
  isWithinTimeLimit,
  mergeCountsByBlobStorageId,
  mapRowsToCountByBlobStorageID,
} = require('../utils');

describe('utils', () => {
  describe('isWithinTimeLimit', () => {
    it('returns false when no date given', () => {
      expect(
        isWithinTimeLimit(),
      ).toEqual(false);
    });
    it('returns false when more than five minutes ago', () => {
      expect(
        isWithinTimeLimit(new Date(2019, 1)),
      ).toEqual(false);
    });
    it('returns true when less than five minutes ago', () => {
      expect(
        isWithinTimeLimit(new Date()),
      ).toEqual(true);
    });
  });

  describe('mergeCountsByBlobStorageId', () => {
    it('successfully merges two counts', () => {
      expect(
        mergeCountsByBlobStorageId([{ 1: 2, 2: 3 }, { 2: 3, 3: 4 }]),
      ).toEqual({ 1: 2, 2: 6, 3: 4 });
    });
    it('successfully merges three counts', () => {
      expect(
        mergeCountsByBlobStorageId([{ 1: 2, 2: 3 }, { 2: 3, 3: 4 }, { 1: 1, 2: 2, 3: 3 }]),
      ).toEqual({ 1: 3, 2: 8, 3: 7 });
    });
    it('successfully merges counts even if one is empty', () => {
      expect(
        mergeCountsByBlobStorageId([{ 1: 2, 2: 3 }, {}]),
      ).toEqual({ 1: 2, 2: 3 });
    });
  });

  describe('mapRowsToCountByBlobStorageID', () => {
    it('successfully maps reference rows to a dictionary', () => {
      expect(
        mapRowsToCountByBlobStorageID([
          { blobStorageId: 1, numReferences: 2 },
          { blobStorageId: 3, numReferences: 2 },
        ]),
      ).toEqual({ 1: 2, 3: 2 });
    });
  });
});
