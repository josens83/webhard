#!/bin/bash

set -e

# Colors
GREEN='\033[0;32m'
NC='\033[0m'

# Load environment variables
if [ -f .env.production ]; then
    export $(cat .env.production | grep -v '^#' | xargs)
fi

# Backup directory
BACKUP_DIR="./backups"
mkdir -p $BACKUP_DIR

# Backup filename with timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/wedisk_backup_$TIMESTAMP.sql"

echo "Creating database backup..."

# Create backup using docker-compose
docker-compose -f docker-compose.prod.yml exec -T postgres pg_dump \
    -U ${DB_USER:-wedisk} \
    -d ${DB_NAME:-wedisk} \
    --clean --if-exists \
    > "$BACKUP_FILE"

# Compress backup
gzip "$BACKUP_FILE"

echo -e "${GREEN}✓ Backup created: ${BACKUP_FILE}.gz${NC}"

# Keep only last 30 backups
ls -t $BACKUP_DIR/wedisk_backup_*.sql.gz | tail -n +31 | xargs -r rm

echo -e "${GREEN}✓ Old backups cleaned up${NC}"
