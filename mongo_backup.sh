#!/bin/bash
# mongo_backup.sh

# Install Environment file
source .env 

# Backup MongoDB
/usr/bin/docker exec mongodb mongodump --username $MONGO_INITDB_ROOT_USERNAME \
 --password $MONGO_INITDB_ROOT_PASSWORD \
 --authenticationDatabase admin --db test --archive=/mongo_backup/test_backup.dump