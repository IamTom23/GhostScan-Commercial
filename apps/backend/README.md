# GhostScan Business Backend MVP

Privacy & Security Management API for Startups and SMBs

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation & Run

```bash
# Install dependencies  
npm install

# Build the TypeScript
npm run build

# Start the server
npm run dev
```

The API will be running at `http://localhost:3001`

## 📡 API Endpoints

### Health & Info
- `GET /health` - Health check with system status
- `GET /api` - API information and available endpoints

### Organizations
- `POST /api/organizations` - Create organization
- `GET /api/organizations/:orgId` - Get organization details
- `PUT /api/organizations/:orgId` - Update organization

### Scanning & Security
- `POST /api/scan` - Run security scan for organization
- `GET /api/breaches/:organizationId` - Get breach alerts
- `GET /api/insights/:organizationId` - Get business insights
- `GET /api/dashboard/:organizationId` - Get dashboard stats

### Authentication (OAuth)
- `GET /auth/google` - Google OAuth login
- `GET /auth/microsoft` - Microsoft OAuth login  
- `GET /auth/status` - Check auth status

## 🧪 Testing the MVP

### 1. Check API Health
```bash
curl http://localhost:3001/health
```

### 2. View Demo Data
```bash
curl http://localhost:3001/api
```

### 3. Test Organization Dashboard
```bash
# Use demo organization ID
curl http://localhost:3001/api/dashboard/org_demo_startup
```

### 4. Run Security Scan
```bash
curl -X POST http://localhost:3001/api/scan \\
  -H "Content-Type: application/json" \\
  -d '{"organizationId": "org_demo_startup"}'
```

### 5. Get Business Insights
```bash
curl http://localhost:3001/api/insights/org_demo_startup
```

## 🏢 Demo Organizations

The MVP includes pre-loaded demo data:

**TechFlow Startup** (`org_demo_startup`)
- Industry: Technology
- Size: 12 employees  
- Risk Score: 72/100
- Apps: 15 (3 high-risk, 1 critical)

**GrowthCorp SMB** (`org_demo_smb`)
- Industry: Marketing
- Size: 45 employees
- Risk Score: 58/100  
- Apps: 28 (5 high-risk, 0 critical)

## 🔧 Configuration

### Environment Variables
Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Key settings for MVP:
- `PORT=3001` - Server port
- `NODE_ENV=development` - Environment
- `FRONTEND_URL=http://localhost:5173` - Frontend URL

### OAuth Setup (Optional for MVP)
To test OAuth features, configure:
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth secret
- `MICROSOFT_CLIENT_ID` - Microsoft OAuth client ID  
- `MICROSOFT_CLIENT_SECRET` - Microsoft OAuth secret

## 📊 API Response Examples

### Health Check Response
```json
{
  "status": "OK",
  "service": "GhostScan Business API", 
  "version": "1.0.0-mvp",
  "demo_data": {
    "organizations": 2,
    "users": 3,
    "scan_results": 0
  }
}
```

### Dashboard Response
```json
{
  "organization": {
    "name": "TechFlow Startup",
    "riskScore": 72,
    "totalApps": 15
  },
  "totalApps": 15,
  "businessCriticalApps": 3,
  "complianceGaps": 2,
  "departmentCoverage": ["Engineering", "Marketing", "Sales"]
}
```

## 🐛 Development

### Available Scripts
- `npm run dev` - Development server with hot reload
- `npm run build` - Production build
- `npm run start` - Start production server
- `npm run lint` - Code linting
- `npm run format` - Code formatting

### Project Structure
```
src/
├── config/          # OAuth configuration
├── routes/          # API route handlers  
├── services/        # Business logic services
├── types/           # TypeScript type definitions
├── demo-data.ts     # Demo data seeder
└── index.ts         # Main server file
```

## 🚀 Next Steps

This MVP provides:
- ✅ Complete API structure
- ✅ Demo data for testing
- ✅ OAuth integration (Google + Microsoft)
- ✅ Business-focused scanning
- ✅ Compliance monitoring
- ✅ Risk assessment

For production deployment, consider:
- Database integration (PostgreSQL/MongoDB)
- Enhanced security & rate limiting  
- Comprehensive testing
- Error monitoring
- API documentation (Swagger)

---

**GhostScan Business MVP** - Privacy & Security Management for Startups and SMBs