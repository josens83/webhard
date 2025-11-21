#!/bin/bash

set -e

echo "🚀 WeDisk Production Deployment Script"
echo "======================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}Please run as root or with sudo${NC}"
    exit 1
fi

# Check if .env.production exists
if [ ! -f .env.production ]; then
    echo -e "${YELLOW}Warning: .env.production file not found${NC}"
    echo "Please create .env.production from .env.production.example"
    exit 1
fi

# Load environment variables
export $(cat .env.production | grep -v '^#' | xargs)

echo -e "${GREEN}✓ Environment variables loaded${NC}"

# Check Docker and Docker Compose
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Docker is not installed${NC}"
    exit 1
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo -e "${RED}Docker Compose is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Docker and Docker Compose are installed${NC}"

# Create necessary directories
echo "Creating necessary directories..."
mkdir -p nginx/ssl nginx/logs monitoring/grafana/{dashboards,datasources} backups backend/logs backend/uploads

echo -e "${GREEN}✓ Directories created${NC}"

# Generate self-signed SSL certificate if not exists
if [ ! -f nginx/ssl/fullchain.pem ]; then
    echo "Generating self-signed SSL certificate..."
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout nginx/ssl/privkey.pem \
        -out nginx/ssl/fullchain.pem \
        -subj "/C=KR/ST=Seoul/L=Seoul/O=WeDisk/CN=localhost"
    echo -e "${YELLOW}⚠ Using self-signed certificate. Replace with Let's Encrypt in production!${NC}"
fi

# Pull latest images
echo "Pulling latest Docker images..."
docker-compose -f docker-compose.prod.yml pull

echo -e "${GREEN}✓ Images pulled${NC}"

# Build custom images
echo "Building custom images..."
docker-compose -f docker-compose.prod.yml build --no-cache

echo -e "${GREEN}✓ Images built${NC}"

# Stop existing containers
echo "Stopping existing containers..."
docker-compose -f docker-compose.prod.yml down

# Start services
echo "Starting services..."
docker-compose -f docker-compose.prod.yml up -d

echo -e "${GREEN}✓ Services started${NC}"

# Wait for database to be ready
echo "Waiting for database..."
sleep 10

# Run database migrations
echo "Running database migrations..."
docker-compose -f docker-compose.prod.yml exec -T backend npx prisma migrate deploy

echo -e "${GREEN}✓ Migrations completed${NC}"

# Seed database (optional)
read -p "Do you want to seed the database with sample data? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Seeding database..."
    docker-compose -f docker-compose.prod.yml exec -T backend npm run seed
    echo -e "${GREEN}✓ Database seeded${NC}"
fi

# Show status
echo ""
echo "Checking container status..."
docker-compose -f docker-compose.prod.yml ps

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Deployment completed successfully!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Services:"
echo "  - Frontend: https://localhost"
echo "  - Backend API: https://localhost/api"
echo "  - MinIO Console: https://localhost/minio"
echo "  - Grafana: https://localhost/grafana"
echo ""
echo "Useful commands:"
echo "  View logs: docker-compose -f docker-compose.prod.yml logs -f [service]"
echo "  Stop services: docker-compose -f docker-compose.prod.yml down"
echo "  Restart services: docker-compose -f docker-compose.prod.yml restart"
echo "  Backup database: ./scripts/backup-db.sh"
echo ""
