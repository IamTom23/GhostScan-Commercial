// Export Service for Cloudyx Dashboard
// Handles PDF report generation and CSV data exports

interface SecurityReport {
  organizationName: string;
  reportDate: string;
  overallScore: number;
  overallGrade: string;
  totalApps: number;
  highRiskApps: number;
  dimensions: {
    oauthRiskScore: number;
    dataExposureScore: number;
    complianceScore: number;
    accessControlScore: number;
  };
  recommendations: string[];
  riskFactors: string[];
  apps: any[];
  breachAlerts: any[];
  actionItems: any[];
}

class ExportService {
  // Generate PDF Security Report
  generatePDFReport(data: SecurityReport): void {
    try {
      // Create a comprehensive HTML report that can be printed as PDF
      const reportHTML = this.generateReportHTML(data);
      
      // Open in new window for printing
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(reportHTML);
        printWindow.document.close();
        
        // Trigger print dialog after content loads
        printWindow.onload = () => {
          setTimeout(() => {
            printWindow.print();
          }, 500);
        };
      }
    } catch (error) {
      console.error('Error generating PDF report:', error);
      alert('Failed to generate PDF report. Please try again.');
    }
  }

  // Generate HTML report template
  private generateReportHTML(data: SecurityReport): string {
    const currentDate = new Date().toLocaleDateString();
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Cloudyx Security Report - ${data.organizationName}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            line-height: 1.5;
            color: #1f2937;
            padding: 40px;
            background: #ffffff;
          }
          .header {
            text-align: center;
            margin-bottom: 40px;
            border-bottom: 2px solid #3b82f6;
            padding-bottom: 20px;
          }
          .logo { 
            font-size: 28px; 
            font-weight: bold; 
            color: #3b82f6;
            margin-bottom: 8px;
          }
          .subtitle { color: #6b7280; font-size: 14px; }
          .report-title { 
            font-size: 24px; 
            font-weight: 600; 
            margin: 20px 0 10px 0;
          }
          .report-meta {
            display: flex;
            justify-content: space-between;
            font-size: 14px;
            color: #6b7280;
          }
          .section {
            margin: 30px 0;
            page-break-inside: avoid;
          }
          .section-title {
            font-size: 18px;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 15px;
            border-left: 4px solid #3b82f6;
            padding-left: 12px;
          }
          .score-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin: 20px 0;
          }
          .score-card {
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
          }
          .score-value {
            font-size: 36px;
            font-weight: bold;
            color: #3b82f6;
          }
          .score-label {
            font-size: 14px;
            color: #6b7280;
            margin-top: 5px;
          }
          .recommendations {
            background: #f9fafb;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
          }
          .recommendations ul {
            list-style: none;
            padding: 0;
          }
          .recommendations li {
            padding: 8px 0;
            border-bottom: 1px solid #e5e7eb;
          }
          .recommendations li:last-child { border-bottom: none; }
          .risk-factors {
            background: #fef2f2;
            border: 1px solid #fca5a5;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
          }
          .apps-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
          }
          .apps-table th,
          .apps-table td {
            border: 1px solid #e5e7eb;
            padding: 12px;
            text-align: left;
          }
          .apps-table th {
            background: #f9fafb;
            font-weight: 600;
          }
          .risk-high { color: #dc2626; font-weight: 600; }
          .risk-medium { color: #d97706; font-weight: 600; }
          .risk-low { color: #059669; font-weight: 600; }
          .footer {
            margin-top: 50px;
            text-align: center;
            font-size: 12px;
            color: #6b7280;
            border-top: 1px solid #e5e7eb;
            padding-top: 20px;
          }
          @media print {
            body { padding: 20px; }
            .header { page-break-after: avoid; }
            .section { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">☁️ Cloudyx</div>
          <div class="subtitle">AI-Powered SaaS Security Management</div>
          <div class="report-title">Security Assessment Report</div>
          <div class="report-meta">
            <span>Organization: ${data.organizationName}</span>
            <span>Generated: ${currentDate}</span>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Executive Summary</div>
          <div class="score-grid">
            <div class="score-card">
              <div class="score-value">${data.overallScore}/100</div>
              <div class="score-label">Overall Security Score</div>
            </div>
            <div class="score-card">
              <div class="score-value">${data.overallGrade}</div>
              <div class="score-label">Security Grade</div>
            </div>
            <div class="score-card">
              <div class="score-value">${data.totalApps}</div>
              <div class="score-label">Connected Apps</div>
            </div>
            <div class="score-card">
              <div class="score-value">${data.highRiskApps}</div>
              <div class="score-label">High Risk Apps</div>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Security Dimensions</div>
          <div class="score-grid">
            <div class="score-card">
              <div class="score-value">${data.dimensions.oauthRiskScore}</div>
              <div class="score-label">OAuth Security</div>
            </div>
            <div class="score-card">
              <div class="score-value">${data.dimensions.dataExposureScore}</div>
              <div class="score-label">Data Protection</div>
            </div>
            <div class="score-card">
              <div class="score-value">${data.dimensions.complianceScore}</div>
              <div class="score-label">Compliance</div>
            </div>
            <div class="score-card">
              <div class="score-value">${data.dimensions.accessControlScore}</div>
              <div class="score-label">Access Control</div>
            </div>
          </div>
        </div>

        ${data.recommendations.length > 0 ? `
        <div class="section">
          <div class="section-title">Security Recommendations</div>
          <div class="recommendations">
            <ul>
              ${data.recommendations.map(rec => `<li>• ${rec}</li>`).join('')}
            </ul>
          </div>
        </div>
        ` : ''}

        ${data.riskFactors.length > 0 ? `
        <div class="section">
          <div class="section-title">Risk Factors</div>
          <div class="risk-factors">
            <ul>
              ${data.riskFactors.map(risk => `<li>⚠️ ${risk}</li>`).join('')}
            </ul>
          </div>
        </div>
        ` : ''}

        ${data.apps.length > 0 ? `
        <div class="section">
          <div class="section-title">Connected Applications</div>
          <table class="apps-table">
            <thead>
              <tr>
                <th>Application</th>
                <th>Risk Level</th>
                <th>Data Types</th>
                <th>Last Accessed</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${data.apps.slice(0, 10).map(app => `
                <tr>
                  <td>${app.name}</td>
                  <td class="risk-${app.riskLevel.toLowerCase()}">${app.riskLevel}</td>
                  <td>${app.dataTypes ? app.dataTypes.join(', ') : 'N/A'}</td>
                  <td>${app.lastAccessed ? new Date(app.lastAccessed).toLocaleDateString() : 'Unknown'}</td>
                  <td>${app.accountStatus || 'Active'}</td>
                </tr>
              `).join('')}
              ${data.apps.length > 10 ? `<tr><td colspan="5" style="text-align: center; font-style: italic;">... and ${data.apps.length - 10} more applications</td></tr>` : ''}
            </tbody>
          </table>
        </div>
        ` : ''}

        <div class="footer">
          <p>This report was generated by Cloudyx AI-Powered SaaS Security Management Platform</p>
          <p>Report generated on ${currentDate} • Confidential and Proprietary</p>
        </div>
      </body>
      </html>
    `;
  }

  // Export data to CSV
  exportToCSV(data: any[], filename: string, headers?: string[]): void {
    try {
      if (!data || data.length === 0) {
        alert('No data available to export.');
        return;
      }

      // Get headers from first object keys if not provided
      const csvHeaders = headers || Object.keys(data[0]);
      
      // Create CSV content
      let csvContent = csvHeaders.join(',') + '\n';
      
      // Add data rows
      data.forEach(row => {
        const values = csvHeaders.map(header => {
          const value = row[header];
          // Handle values that might contain commas or quotes
          if (value === null || value === undefined) {
            return '';
          }
          const stringValue = String(value);
          if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          return stringValue;
        });
        csvContent += values.join(',') + '\n';
      });

      // Create and download file
      this.downloadFile(csvContent, `${filename}.csv`, 'text/csv');
    } catch (error) {
      console.error('Error exporting CSV:', error);
      alert('Failed to export CSV. Please try again.');
    }
  }

  // Export Apps data to CSV
  exportAppsToCSV(apps: any[]): void {
    const headers = [
      'name', 'domain', 'riskLevel', 'dataTypes', 'hasBreaches', 
      'thirdPartySharing', 'lastAccessed', 'accountStatus', 'passwordStrength'
    ];
    
    const processedData = apps.map(app => ({
      ...app,
      dataTypes: Array.isArray(app.dataTypes) ? app.dataTypes.join('; ') : app.dataTypes,
      lastAccessed: app.lastAccessed ? new Date(app.lastAccessed).toLocaleDateString() : 'Unknown',
      hasBreaches: app.hasBreaches ? 'Yes' : 'No',
      thirdPartySharing: app.thirdPartySharing ? 'Yes' : 'No'
    }));

    this.exportToCSV(processedData, 'cloudyx-applications-report', headers);
  }

  // Export Security Actions to CSV
  exportActionsToCSV(actions: any[]): void {
    const headers = ['title', 'priority', 'type', 'description', 'estimatedTime', 'completed'];
    
    const processedData = actions.map(action => ({
      ...action,
      completed: action.completed ? 'Yes' : 'No'
    }));

    this.exportToCSV(processedData, 'cloudyx-security-actions', headers);
  }

  // Helper method to download file
  private downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the URL object
    window.URL.revokeObjectURL(url);
  }
}

export const exportService = new ExportService();