create table if not exists BlobReferenceCount (
    BlobStorageID bigint(20) PRIMARY KEY not null,
    NumReferences bigint(20) not null,
    UpdatedAt timestamp default now()
);

create table if not exists BlobReferenceCron (
    id INT AUTO_INCREMENT PRIMARY KEY,
    TableName varchar(255) not null,
    ColumnName varchar(255) not null,
    StartedAt timestamp null default null,
    EndedAt timestamp null default null,
    CountByBlobStorageID LONGTEXT null default null,
    UNIQUE KEY BlobReferenceCronTableColumn(TableName, ColumnName)
);

insert into BlobReferenceCron (TableName, ColumnName) values
('SentMessage', 'BlobStorageID'),
('SentAttachment', 'BlobStorageID');
