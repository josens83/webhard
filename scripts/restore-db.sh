#!/bin/bash

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Load environment variables
if [ -f .env.production ]; then
    export $(cat .env.production | grep -v '^#' | xargs)
fi

# Check if backup file is provided
if [ -z "$1" ]; then
    echo -e "${RED}Usage: $0 <backup_file.sql.gz>${NC}"
    echo "Available backups:"
    ls -lh ./backups/wedisk_backup_*.sql.gz 2>/dev/null || echo "No backups found"
    exit 1
fi

BACKUP_FILE=$1

# Check if file exists
if [ ! -f "$BACKUP_FILE" ]; then
    echo -e "${RED}Backup file not found: $BACKUP_FILE${NC}"
    exit 1
fi

# Confirm restoration
echo -e "${YELLOW}⚠ WARNING: This will restore the database from backup${NC}"
echo -e "${YELLOW}⚠ All current data will be replaced!${NC}"
read -p "Are you sure you want to continue? (yes/NO) " -r
echo

if [[ ! $REPLY =~ ^yes$ ]]; then
    echo "Restoration cancelled"
    exit 0
fi

echo "Decompressing backup..."
TEMP_FILE=$(mktemp)
gunzip -c "$BACKUP_FILE" > "$TEMP_FILE"

echo "Restoring database..."
docker-compose -f docker-compose.prod.yml exec -T postgres psql \
    -U ${DB_USER:-wedisk} \
    -d ${DB_NAME:-wedisk} \
    < "$TEMP_FILE"

# Clean up
rm "$TEMP_FILE"

echo -e "${GREEN}✓ Database restored successfully${NC}"
