# GhostScan Business Dashboard - MVP

A privacy & security management dashboard for startups and SMBs, deployed on Vercel.

## 🚀 Live Demo

Visit the live dashboard: https://ghostscan-dashboard.vercel.app

## 📊 Demo Organizations

- **TechFlow Startup**: `/api/dashboard/org_demo_startup`
- **GrowthCorp SMB**: `/api/dashboard/org_demo_smb`

## 🛠 API Endpoints

- `GET /api/health` - Health check
- `GET /api/` - API information
- `GET /api/dashboard/[orgId]` - Organization dashboard data

## 🏗 Architecture

- **Frontend**: React + Vite (SPA)
- **Backend**: Vercel Serverless Functions
- **Data**: In-memory demo data
- **Deployment**: Vercel

## 🔧 Local Development

```bash
npm install
npm run dev
```

## 📦 Deployment

```bash
npm run build
vercel --prod
```

## 🎯 MVP Features

- Organization dashboard with privacy scores
- Risk assessment and recommendations
- Breach monitoring alerts
- Compliance tracking
- Responsive design
- Serverless architecture

Built with ❤️ for privacy-conscious businesses.
