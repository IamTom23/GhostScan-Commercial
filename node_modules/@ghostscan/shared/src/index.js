'use strict';
// GhostScan Personal - Shared Types and Utilities
Object.defineProperty(exports, '__esModule', { value: true });
exports.calculateRiskScore = void 0;
// Utility functions
const calculateRiskScore = (apps) => {
  return apps.reduce((score, app) => {
    const riskMultiplier = {
      LOW: 1,
      MEDIUM: 2,
      HIGH: 3,
      CRITICAL: 4,
    };
    return score + riskMultiplier[app.riskLevel];
  }, 0);
};
exports.calculateRiskScore = calculateRiskScore;
