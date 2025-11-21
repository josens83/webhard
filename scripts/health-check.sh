#!/bin/bash

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "WeDisk System Health Check"
echo "=========================="
echo ""

# Check Docker containers
echo "Container Status:"
echo "-----------------"
docker-compose -f docker-compose.prod.yml ps

echo ""
echo "Service Health:"
echo "---------------"

# Check each service
services=("postgres" "redis" "minio" "backend" "frontend" "nginx" "prometheus" "grafana")

for service in "${services[@]}"; do
    STATUS=$(docker-compose -f docker-compose.prod.yml ps -q $service | xargs docker inspect -f '{{.State.Health.Status}}' 2>/dev/null || echo "unknown")

    if [ "$STATUS" == "healthy" ]; then
        echo -e "$service: ${GREEN}✓ Healthy${NC}"
    elif [ "$STATUS" == "unknown" ]; then
        # Check if container is running (no healthcheck defined)
        RUNNING=$(docker-compose -f docker-compose.prod.yml ps -q $service | xargs docker inspect -f '{{.State.Running}}' 2>/dev/null || echo "false")
        if [ "$RUNNING" == "true" ]; then
            echo -e "$service: ${GREEN}✓ Running${NC}"
        else
            echo -e "$service: ${RED}✗ Not Running${NC}"
        fi
    else
        echo -e "$service: ${YELLOW}⚠ $STATUS${NC}"
    fi
done

echo ""
echo "Resource Usage:"
echo "---------------"
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}\t{{.BlockIO}}"

echo ""
echo "Disk Usage:"
echo "-----------"
echo "Docker volumes:"
docker volume ls -q | grep wedisk | xargs -I {} docker volume inspect {} --format '{{ .Name }}: {{ .Mountpoint }}' 2>/dev/null || echo "No volumes found"

echo ""
df -h | grep -E "(Filesystem|/dev/)"

echo ""
echo "Network Connectivity:"
echo "---------------------"

# Test frontend
if curl -sSf http://localhost/health > /dev/null 2>&1; then
    echo -e "Frontend: ${GREEN}✓ Accessible${NC}"
else
    echo -e "Frontend: ${RED}✗ Not accessible${NC}"
fi

# Test backend
if curl -sSf http://localhost/api/health > /dev/null 2>&1; then
    echo -e "Backend API: ${GREEN}✓ Accessible${NC}"
else
    echo -e "Backend API: ${RED}✗ Not accessible${NC}"
fi

echo ""
