// Extension Service - REMOVED
// Browser extension is no longer needed for this project

export const extensionService = {
  testConnection: () => Promise.resolve({ success: false, message: 'Extension removed' }),
  getExtensionData: () => Promise.resolve(null),
  triggerExtensionScan: () => Promise.resolve(null),
  convertToDashboardFormat: () => null
};