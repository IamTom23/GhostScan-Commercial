'use strict';
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
const express_1 = __importDefault(require('express'));
const cors_1 = __importDefault(require('cors'));
const helmet_1 = __importDefault(require('helmet'));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
// Middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'GhostScan Backend API' });
});
// API routes will be added here
app.get('/api/scan', (req, res) => {
  res.json({ message: 'SaaS exposure scan endpoint' });
});
app.listen(PORT, () => {
  console.log(`🚀 GhostScan Backend API running on port ${PORT}`);
});
