create table if not exists BlobReferenceCount (
    BlobStorageID bigint(20) PRIMARY KEY not null,
    NumReferences bigint(20) not null
);

create table if not exists BlobReferenceCountRuns (
    id INT AUTO_INCREMENT PRIMARY KEY,
    startedAt timestamp null default null,
    endedAt timestamp null default null
);

create table if not exists TableReferencesToBlobStorageID (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tableName varchar(255) not null,
    columnName varchar(255) not null,
    startedAt timestamp null default null,
    endedAt timestamp null default null,
    countByBlobStorageID LONGTEXT null default null,
    UNIQUE KEY TableReferencesToBlobStorageIDTableColumn(tableName, columnName)
);

insert into TableReferencesToBlobStorageID (tableName, columnName) values
('SentMessage', 'BlobStorageID'),
('SentAttachment', 'BlobStorageID');
