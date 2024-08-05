#!/bin/bash
# mongo_restore.sh

# Install Environment file
source .env 

# Restore MongoDB
/usr/bin/docker exec mongodb_acc mongorestore --username $MONGO_INITDB_ROOT_USERNAME \
 --password $MONGO_INITDB_ROOT_PASSWORD \
 --authenticationDatabase admin --nsInclude='test.*' --archive=/mongo_backup/test_backup.dump