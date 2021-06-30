# Proton Dev Task

## Output summary

This script queries both the ProtonMailGlobal and ProtonMailShard DB's to identify any inconsistencies in references to BlobStorageIds.

The result returns an object with three keys:

1. ``orphanBlobStorageIDs`` the BlobStorageIds for records in the ProtonMailGlobal.BlobStorage table that are not referenced by any other row in any other table in either ProtonMailGlobal or ProtonMailShard.

2. ``missingBlobStorageIDs`` the BlobStorageIds that are referenced by rows in other tables, but do not exist in ProtonMailGlobal.BlobStorage

3. ``blobStoreIDsWithBadCounts`` the BlobStoragIds whose ``NumReferences`` value in the ProtonMailGlobal.BlobStorage table does not represent the true number of references to the BlobStorageId from other row in other tables.

## Local set up

1. Ensure that you have MySQL 5.7 and Node (ideally 16.4, but should work with other versions) installed on your machine and running
2. Import the two databases into your MySQL DB
3. CD into the proton-js directory (``cd proton-js/``)
4. Install all dependencies (``npm install``)
5. Create a .env file with all the variables listed in config.js
6. CD into the db/mail-global directory (``cd db/mail-global``), hardcode the appropriate env variables into database.json, and run the migrations (``db-migrate up --env local --sql-file``)
7. CD into the db/mail-local directory (``cd ../mail-local``), hardcode the appropriate env variables into database.json, and run the migrations (``db-migrate up --env local --sql-file``)

## To run the script

```
cd proton-js/
npm run start
```
