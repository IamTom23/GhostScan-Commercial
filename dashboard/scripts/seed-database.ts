#!/usr/bin/env node
// Database seeding script for Cloudyx Security Dashboard
import { database, organizationDAO, userDAO, applicationDAO, breachAlertDAO, securityScanDAO } from '../lib/database';

async function seedDatabase() {
  console.log('🌱 Starting database seeding...');

  try {
    // Test database connection
    const connectionTest = await database.testConnection();
    if (!connectionTest.success) {
      console.error('❌ Database connection failed:', connectionTest.message);
      process.exit(1);
    }
    console.log('✅ Database connected successfully');

    // Create demo startup organization
    console.log('📊 Creating demo startup organization...');
    const startupOrg = await organizationDAO.create({
      name: 'TechFlow Startup',
      slug: 'org_demo_startup',
      type: 'startup',
      employees: 12,
      industry: 'Technology',
      website: 'techflow.io',
      primaryEmail: 'security@techflow.io'
    });
    console.log('✅ Created startup organization:', startupOrg.id);

    // Create demo SMB organization  
    console.log('📊 Creating demo SMB organization...');
    const smbOrg = await organizationDAO.create({
      name: 'GrowthCorp SMB',
      slug: 'org_demo_smb', 
      type: 'smb',
      employees: 45,
      industry: 'Marketing',
      website: 'growthcorp.com',
      primaryEmail: 'admin@growthcorp.com'
    });
    console.log('✅ Created SMB organization:', smbOrg.id);

    // Create demo users
    console.log('👥 Creating demo users...');
    
    const startupAdmin = await userDAO.create({
      organizationId: startupOrg.id,
      email: 'admin@techflow.io',
      firstName: 'Sarah',
      lastName: 'Chen',
      role: 'owner'
    });
    
    const smbSecurityAdmin = await userDAO.create({
      organizationId: smbOrg.id,
      email: 'security@growthcorp.com',
      firstName: 'Michael',
      lastName: 'Rodriguez',
      role: 'security_admin'
    });
    
    console.log('✅ Created demo users');

    // Create demo applications for startup
    console.log('📱 Creating demo applications...');
    
    const startupApps = [
      {
        organizationId: startupOrg.id,
        name: 'Google Workspace',
        domain: 'workspace.google.com',
        appType: 'saas',
        category: 'productivity',
        discoveryMethod: 'oauth_scan' as const,
        riskLevel: 'low' as const
      },
      {
        organizationId: startupOrg.id,
        name: 'Slack',
        domain: 'slack.com',
        appType: 'saas', 
        category: 'communication',
        discoveryMethod: 'oauth_scan' as const,
        riskLevel: 'medium' as const
      },
      {
        organizationId: startupOrg.id,
        name: 'GitHub',
        domain: 'github.com',
        appType: 'saas',
        category: 'development',
        discoveryMethod: 'oauth_scan' as const,
        riskLevel: 'high' as const
      },
      {
        organizationId: startupOrg.id,
        name: 'AWS Console',
        domain: 'console.aws.amazon.com',
        appType: 'iaas',
        category: 'infrastructure',
        discoveryMethod: 'cloud_api' as const,
        riskLevel: 'critical' as const
      }
    ];

    for (const appData of startupApps) {
      await applicationDAO.create(appData);
    }

    // Create demo applications for SMB
    const smbApps = [
      {
        organizationId: smbOrg.id,
        name: 'HubSpot',
        domain: 'hubspot.com',
        appType: 'saas',
        category: 'crm',
        discoveryMethod: 'oauth_scan' as const,
        riskLevel: 'medium' as const
      },
      {
        organizationId: smbOrg.id,
        name: 'MailChimp',
        domain: 'mailchimp.com',
        appType: 'saas',
        category: 'marketing',
        discoveryMethod: 'oauth_scan' as const,
        riskLevel: 'high' as const
      },
      {
        organizationId: smbOrg.id,
        name: 'Salesforce',
        domain: 'salesforce.com',
        appType: 'saas',
        category: 'crm',
        discoveryMethod: 'oauth_scan' as const,
        riskLevel: 'medium' as const
      }
    ];

    for (const appData of smbApps) {
      await applicationDAO.create(appData);
    }

    console.log('✅ Created demo applications');

    // Create demo breach alerts
    console.log('🚨 Creating demo breach alerts...');
    
    await breachAlertDAO.create({
      organizationId: startupOrg.id,
      breachTitle: 'GitHub Security Incident',
      breachDescription: 'Unauthorized access to private repositories detected',
      breachDate: new Date('2024-01-15'),
      severity: 'high',
      affectedDataTypes: ['source_code', 'api_keys', 'user_data'],
      source: 'vendor_notification',
      externalReference: 'https://github.com/security-advisories/GHSA-xxxx-xxxx-xxxx'
    });

    await breachAlertDAO.create({
      organizationId: smbOrg.id,
      breachTitle: 'MailChimp Data Exposure',
      breachDescription: 'Customer email lists temporarily exposed due to misconfiguration',
      breachDate: new Date('2024-01-12'),
      severity: 'medium', 
      affectedDataTypes: ['email_addresses', 'subscriber_data', 'campaign_metrics'],
      source: 'security_scan'
    });

    await breachAlertDAO.create({
      organizationId: smbOrg.id,
      breachTitle: 'HubSpot Contact Data Incident',
      breachDescription: 'Third-party integration leaked contact information',
      breachDate: new Date('2024-01-08'),
      severity: 'low',
      affectedDataTypes: ['contact_info', 'interaction_logs'],
      source: 'vendor_notification'
    });

    console.log('✅ Created demo breach alerts');

    // Create demo security scans
    console.log('🔍 Creating demo security scans...');
    
    const startupScan = await securityScanDAO.create({
      organizationId: startupOrg.id,
      scanType: 'full',
      triggeredBy: 'onboarding'
    });

    await securityScanDAO.updateProgress(startupScan.id, 100);

    const smbScan = await securityScanDAO.create({
      organizationId: smbOrg.id,
      scanType: 'full',
      triggeredBy: 'onboarding'
    });

    await securityScanDAO.updateProgress(smbScan.id, 100);

    console.log('✅ Created demo security scans');

    // Update organization security metrics
    console.log('📊 Updating organization security metrics...');
    
    await organizationDAO.updateSecurityMetrics(startupOrg.id, {
      securityGrade: 'B+',
      privacyScore: 72,
      lastScanAt: new Date()
    });

    await organizationDAO.updateSecurityMetrics(smbOrg.id, {
      securityGrade: 'C-',
      privacyScore: 58,
      lastScanAt: new Date()
    });

    console.log('✅ Updated security metrics');

    console.log('🎉 Database seeding completed successfully!');
    console.log('');
    console.log('Demo Organizations Created:');
    console.log(`- Startup: ${startupOrg.name} (${startupOrg.id})`);
    console.log(`- SMB: ${smbOrg.name} (${smbOrg.id})`);
    console.log('');
    console.log('You can now access the dashboard with these organization IDs');

  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    process.exit(1);
  } finally {
    await database.close();
  }
}

// Run the seeding script
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('✅ Seeding script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seeding script failed:', error);
      process.exit(1);
    });
}

export default seedDatabase;