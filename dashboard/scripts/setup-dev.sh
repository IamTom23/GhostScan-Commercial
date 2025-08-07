#!/bin/bash
# Cloudyx Security Dashboard - Development Setup Script

set -e

echo "🚀 Setting up Cloudyx Security Dashboard development environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed. Please install Docker first.${NC}"
    echo "Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not installed. Please install Docker Compose first.${NC}"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js 18+ first.${NC}"
    echo "Visit: https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}❌ Node.js version 18+ is required. Current version: $(node -v)${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Prerequisites check passed${NC}"

# Create environment file if it doesn't exist
if [ ! -f .env ]; then
    echo -e "${YELLOW}📝 Creating environment configuration...${NC}"
    cp .env.example .env
    
    # Update with development database settings
    sed -i 's/DATABASE_HOST=localhost/DATABASE_HOST=localhost/' .env
    sed -i 's/DATABASE_PASSWORD=your_secure_password_here/DATABASE_PASSWORD=cloudyx_dev_password/' .env
    
    echo -e "${GREEN}✅ Environment file created (.env)${NC}"
    echo -e "${YELLOW}💡 Please review and update .env file with your specific settings${NC}"
else
    echo -e "${BLUE}ℹ️  Environment file already exists${NC}"
fi

# Install dependencies
echo -e "${YELLOW}📦 Installing npm dependencies...${NC}"
npm install

# Start database services
echo -e "${YELLOW}🐘 Starting PostgreSQL and Redis services...${NC}"
if command -v docker-compose &> /dev/null; then
    docker-compose up -d postgres redis
else
    docker compose up -d postgres redis
fi

# Wait for database to be ready
echo -e "${YELLOW}⏳ Waiting for database to be ready...${NC}"
sleep 10

# Check if database is responding
max_attempts=30
attempt=1
while [ $attempt -le $max_attempts ]; do
    if docker exec cloudyx-postgres pg_isready -U cloudyx -d cloudyx_security > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Database is ready${NC}"
        break
    fi
    
    if [ $attempt -eq $max_attempts ]; then
        echo -e "${RED}❌ Database failed to start after $max_attempts attempts${NC}"
        echo "Try running: docker logs cloudyx-postgres"
        exit 1
    fi
    
    echo "Waiting for database... (attempt $attempt/$max_attempts)"
    sleep 2
    ((attempt++))
done

# Run database migrations (schema is applied automatically via initdb)
echo -e "${YELLOW}🗄️  Database schema loaded automatically via Docker initialization${NC}"

# Seed database with demo data
echo -e "${YELLOW}🌱 Seeding database with demo data...${NC}"
npm run db:seed

echo -e "${GREEN}✅ Database seeded successfully${NC}"

# Test API connection
echo -e "${YELLOW}🧪 Testing API connection...${NC}"
npm run dev &
DEV_PID=$!

# Give the server time to start
sleep 5

# Test health endpoint
if curl -s http://localhost:3000/api/health > /dev/null; then
    echo -e "${GREEN}✅ API server is responding${NC}"
else
    echo -e "${YELLOW}⚠️  API server may take a moment to fully start${NC}"
fi

# Kill the dev server
kill $DEV_PID 2>/dev/null || true
sleep 2

echo ""
echo -e "${GREEN}🎉 Development environment setup complete!${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo -e "1. Start the development server: ${YELLOW}npm run dev${NC}"
echo -e "2. Open your browser to: ${YELLOW}http://localhost:3000${NC}"
echo -e "3. Test demo organizations:"
echo -e "   - Startup: ${YELLOW}http://localhost:3000/api/dashboard/org_demo_startup${NC}"
echo -e "   - SMB: ${YELLOW}http://localhost:3000/api/dashboard/org_demo_smb${NC}"
echo ""
echo -e "${BLUE}Database access:${NC}"
echo -e "- PostgreSQL: ${YELLOW}psql -h localhost -U cloudyx -d cloudyx_security${NC}"
echo -e "- pgAdmin: ${YELLOW}http://localhost:5050${NC} (admin@cloudyx.local / admin)"
echo -e "- Redis CLI: ${YELLOW}docker exec -it cloudyx-redis redis-cli${NC}"
echo ""
echo -e "${BLUE}Useful commands:${NC}"
echo -e "- View logs: ${YELLOW}docker-compose logs -f postgres${NC}"
echo -e "- Stop services: ${YELLOW}docker-compose down${NC}"
echo -e "- Reset database: ${YELLOW}docker-compose down -v && npm run setup${NC}"
echo ""
echo -e "${GREEN}Happy coding! 🚀${NC}"