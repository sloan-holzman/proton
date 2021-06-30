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
('Attachment', 'BlobStorageID'),
('OutsideAttachment', 'BlobStorageID'),
('ContactData', 'BlobStorageID'),
('MessageData', 'Body'),
('MessageData', 'Header');
