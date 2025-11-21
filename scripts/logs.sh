#!/bin/bash

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

SERVICE=${1:-all}
LINES=${2:-100}

echo -e "${GREEN}WeDisk Logs Viewer${NC}"
echo "=================="

if [ "$SERVICE" == "all" ]; then
    echo "Showing logs for all services (last $LINES lines)"
    docker-compose -f docker-compose.prod.yml logs --tail=$LINES -f
else
    echo "Showing logs for $SERVICE (last $LINES lines)"
    docker-compose -f docker-compose.prod.yml logs --tail=$LINES -f $SERVICE
fi

# Usage examples:
# ./scripts/logs.sh              # All services, last 100 lines
# ./scripts/logs.sh backend      # Backend service logs
# ./scripts/logs.sh backend 500  # Backend service, last 500 lines
