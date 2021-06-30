const { DB_PROTON_MAIL_SHARD, DB_PROTON_MAIL_GLOBAL } = require('./config');
const { connection } = require('./db');
const { mergeCountsByBlogStorageId } = require('./utils');
const { getBadReferencesByType } = require('./get-bad-references-by-type')
const { getCombinedCountByBlogStorageId } = require('./get-combined-count-by-blog-storage-id')

const doItAll = async () => {
  const sharedCountByBlogStorageId = await getCombinedCountByBlogStorageId({ db: await connection(DB_PROTON_MAIL_SHARD) });
  const globalCountByBlogStorageId = await getCombinedCountByBlogStorageId({ db: await connection(DB_PROTON_MAIL_GLOBAL) });
  const countByBlogStorageId = mergeCountsByBlogStorageId([
    sharedCountByBlogStorageId,
    globalCountByBlogStorageId,
  ]);
  return getBadReferencesByType({
    db: await connection(DB_PROTON_MAIL_GLOBAL),
    countByBlogStorageId,
  });
};

doItAll().then(() => {
  console.log('success!');
});
