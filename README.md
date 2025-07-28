# GhostScan Personal

An AI-powered app that detects, explains, and helps you eliminate digital exposure in just a few taps. Think of it as a Ghostbuster for your data.

## 🚀 Features

- **🔍 SaaS Exposure Scan** - Detects all web apps and tools you've logged into
- **🧠 AI-powered Threat Rating** - Risk assessment for each detected app
- **✉️ Auto Privacy Request Engine** - One-click GDPR/CCPA compliance requests
- **🕵️ Ghost Profile Hunter** - Finds shadow profiles and breached data
- **🔒 Password Reuse Detection** - Alerts on weak or reused passwords
- **💥 Disconnect Dead Apps** - Helps clean up unused accounts
- **📊 Privacy Dashboard** - Visual breakdown of your digital exposure

## 🏗️ Architecture

This is a monorepo containing:

- **`apps/dashboard`** - React/Vite frontend application
- **`apps/backend`** - Node.js/Express API server
- **`apps/extension`** - Browser extension for deep scanning
- **`packages/shared`** - Shared types and utilities
- **`packages/ai`** - AI/ML functionality for threat analysis

## 🛠️ Development Setup

### Prerequisites

- Node.js 18+
- npm 9+

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd GhostScan_Commercial

# Install dependencies for all workspaces
npm install

# Build all packages
npm run build
```

### Development Commands

```bash
# Start development servers
npm run dev

# Build all packages
npm run build

# Lint code
npm run lint

# Format code
npm run format

# Check formatting
npm run format:check
```

### Individual Workspace Commands

```bash
# Backend API
cd GhostScan-Commercial/apps/backend
npm run dev  # Start development server
npm run build  # Build for production

# Dashboard
cd GhostScan-Commercial/apps/dashboard
npm run dev  # Start Vite dev server
npm run build  # Build for production

# Extension
cd GhostScan-Commercial/apps/extension
npm run build  # Build extension
npm run watch  # Watch for changes

# Shared Package
cd GhostScan-Commercial/packages/shared
npm run build  # Build types and utilities

# AI Package
cd GhostScan-Commercial/packages/ai
npm run build  # Build AI functionality
```

## 📁 Project Structure

```
GhostScan_Commercial/
├── apps/
│   ├── dashboard/          # React frontend
│   ├── backend/           # Express API
│   └── extension/         # Browser extension
├── packages/
│   ├── shared/            # Shared types & utilities
│   └── ai/                # AI/ML functionality
├── .eslintrc.js          # ESLint configuration
├── .prettierrc           # Prettier configuration
├── eslint.config.js      # Modern ESLint config
└── package.json          # Monorepo configuration
```

## 🔧 Code Quality

This project uses:

- **ESLint** - Code linting with TypeScript support
- **Prettier** - Code formatting
- **Husky** - Git hooks for pre-commit checks
- **lint-staged** - Run linters on staged files

## 🚀 Getting Started

1. **Start the Backend API:**

   ```bash
   cd GhostScan-Commercial/apps/backend
   npm run dev
   ```

2. **Start the Dashboard:**

   ```bash
   cd GhostScan-Commercial/apps/dashboard
   npm run dev
   ```

3. **Build the Extension:**
   ```bash
   cd GhostScan-Commercial/apps/extension
   npm run build
   ```

## 📝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run linting and formatting: `npm run lint && npm run format`
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 🔐 Privacy

GhostScan Personal is designed with privacy in mind. All scanning and analysis happens locally or through secure, encrypted connections. No personal data is stored or transmitted without explicit user consent.
