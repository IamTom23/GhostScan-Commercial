-- Cloudyx Security Dashboard Database Schema
-- Supporting SMB cloud security scanning and compliance tracking

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Organizations table
CREATE TABLE organizations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('startup', 'smb', 'enterprise')),
    employees INTEGER DEFAULT 1,
    industry VARCHAR(100),
    website VARCHAR(255),
    
    -- Subscription and billing
    subscription_plan VARCHAR(50) DEFAULT 'free' CHECK (subscription_plan IN ('free', 'starter', 'professional', 'enterprise')),
    subscription_status VARCHAR(20) DEFAULT 'active' CHECK (subscription_status IN ('active', 'cancelled', 'suspended', 'trial')),
    trial_ends_at TIMESTAMP WITH TIME ZONE,
    
    -- Security settings
    security_grade VARCHAR(2) DEFAULT 'C-',
    privacy_score INTEGER DEFAULT 50,
    compliance_frameworks TEXT[], -- ['gdpr', 'sox', 'iso27001', 'hipaa']
    
    -- Contact info
    primary_email VARCHAR(255),
    phone VARCHAR(50),
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    postal_code VARCHAR(20),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_scan_at TIMESTAMP WITH TIME ZONE,
    
    -- Onboarding
    onboarding_completed BOOLEAN DEFAULT FALSE,
    onboarding_step VARCHAR(50) DEFAULT 'welcome',
    
    -- Soft delete
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Users table
CREATE TABLE users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Authentication
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255), -- For direct auth
    email_verified BOOLEAN DEFAULT FALSE,
    email_verification_token VARCHAR(255),
    password_reset_token VARCHAR(255),
    password_reset_expires TIMESTAMP WITH TIME ZONE,
    
    -- OAuth providers
    oauth_providers JSONB DEFAULT '{}', -- {google: {id: "...", email: "..."}, github: {...}}
    
    -- Profile
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    avatar_url VARCHAR(500),
    job_title VARCHAR(100),
    phone VARCHAR(50),
    
    -- Permissions and role
    role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'security_admin', 'member', 'viewer')),
    permissions TEXT[], -- ['manage_users', 'view_reports', 'manage_integrations']
    
    -- Security preferences
    notification_preferences JSONB DEFAULT '{"breach_alerts": true, "weekly_reports": true, "security_tips": true}',
    mfa_enabled BOOLEAN DEFAULT FALSE,
    mfa_secret VARCHAR(255),
    
    -- Activity tracking
    last_login_at TIMESTAMP WITH TIME ZONE,
    login_count INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Cloud provider integrations
CREATE TABLE cloud_integrations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Provider info
    provider VARCHAR(20) NOT NULL CHECK (provider IN ('aws', 'azure', 'gcp', 'alibaba')),
    provider_account_id VARCHAR(255), -- AWS account ID, Azure subscription ID, etc.
    provider_account_name VARCHAR(255),
    region VARCHAR(50),
    
    -- OAuth/API credentials (encrypted)
    access_token_encrypted TEXT,
    refresh_token_encrypted TEXT,
    credentials_encrypted TEXT, -- JSON encrypted blob for API keys, service account keys, etc.
    
    -- Integration status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'error', 'disabled')),
    last_sync_at TIMESTAMP WITH TIME ZONE,
    sync_error_message TEXT,
    
    -- Permissions granted (read-only security scanning)
    permissions_granted TEXT[], -- ['iam:list*', 's3:GetBucketPolicy', etc.]
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(organization_id, provider, provider_account_id)
);

-- Applications discovered through scanning
CREATE TABLE applications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    cloud_integration_id UUID REFERENCES cloud_integrations(id) ON DELETE SET NULL,
    
    -- App identification
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255),
    app_type VARCHAR(50), -- 'saas', 'paas', 'iaas', 'custom'
    category VARCHAR(100), -- 'productivity', 'crm', 'development', 'storage'
    
    -- Discovery method
    discovery_method VARCHAR(50) NOT NULL CHECK (discovery_method IN ('oauth_scan', 'dns_scan', 'cloud_api', 'manual', 'extension')),
    discovery_source VARCHAR(255), -- URL, API endpoint, etc.
    
    -- Risk assessment
    risk_level VARCHAR(20) DEFAULT 'unknown' CHECK (risk_level IN ('low', 'medium', 'high', 'critical', 'unknown')),
    risk_score INTEGER DEFAULT 0, -- 0-100
    risk_factors TEXT[], -- ['public_data', 'weak_auth', 'third_party_sharing']
    
    -- Data handling
    data_types TEXT[], -- ['emails', 'documents', 'financial', 'personal']
    data_sensitivity VARCHAR(20) DEFAULT 'unknown' CHECK (data_sensitivity IN ('public', 'internal', 'confidential', 'restricted', 'unknown')),
    data_retention_days INTEGER,
    
    -- Security posture
    has_mfa BOOLEAN,
    has_sso BOOLEAN,
    password_policy_grade VARCHAR(2), -- 'A+', 'A', 'B+', etc.
    last_password_change TIMESTAMP WITH TIME ZONE,
    
    -- Compliance
    gdpr_compliant BOOLEAN,
    sox_compliant BOOLEAN,
    hipaa_compliant BOOLEAN,
    privacy_policy_url VARCHAR(500),
    terms_of_service_url VARCHAR(500),
    
    -- Usage statistics
    monthly_active_users INTEGER DEFAULT 0,
    data_volume_gb DECIMAL(10,2) DEFAULT 0,
    api_calls_per_month BIGINT DEFAULT 0,
    
    -- Breach history
    known_breaches_count INTEGER DEFAULT 0,
    last_breach_date TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_scanned_at TIMESTAMP WITH TIME ZONE,
    
    -- Status
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'deprecated', 'archived'))
);

-- Security scans and results
CREATE TABLE security_scans (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    cloud_integration_id UUID REFERENCES cloud_integrations(id) ON DELETE SET NULL,
    
    -- Scan configuration
    scan_type VARCHAR(50) NOT NULL CHECK (scan_type IN ('full', 'quick', 'targeted', 'compliance', 'breach_check')),
    scan_scope TEXT[], -- ['applications', 'infrastructure', 'iam', 'data_exposure']
    triggered_by VARCHAR(50) DEFAULT 'manual' CHECK (triggered_by IN ('manual', 'scheduled', 'onboarding', 'webhook', 'api')),
    
    -- Scan status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
    progress_percentage INTEGER DEFAULT 0,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Results summary
    total_checks INTEGER DEFAULT 0,
    passed_checks INTEGER DEFAULT 0,
    failed_checks INTEGER DEFAULT 0,
    critical_issues INTEGER DEFAULT 0,
    high_issues INTEGER DEFAULT 0,
    medium_issues INTEGER DEFAULT 0,
    low_issues INTEGER DEFAULT 0,
    
    -- Scores (0-100)
    overall_score INTEGER DEFAULT 0,
    security_score INTEGER DEFAULT 0,
    privacy_score INTEGER DEFAULT 0,
    compliance_score INTEGER DEFAULT 0,
    
    -- Raw results (JSON)
    results_data JSONB,
    error_message TEXT,
    
    -- Metadata
    scanner_version VARCHAR(50),
    scan_duration_seconds INTEGER,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Individual security findings/issues
CREATE TABLE security_findings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    scan_id UUID REFERENCES security_scans(id) ON DELETE CASCADE,
    application_id UUID REFERENCES applications(id) ON DELETE SET NULL,
    
    -- Finding identification
    finding_type VARCHAR(100) NOT NULL, -- 'exposed_database', 'weak_password', 'missing_mfa'
    category VARCHAR(50) NOT NULL, -- 'authentication', 'authorization', 'data_exposure', 'configuration'
    title VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Severity and priority
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('info', 'low', 'medium', 'high', 'critical')),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    cvss_score DECIMAL(3,1), -- Common Vulnerability Scoring System
    
    -- Affected resources
    resource_type VARCHAR(100), -- 'S3_bucket', 'IAM_user', 'Database', 'API_endpoint'
    resource_identifier VARCHAR(255), -- ARN, URL, name, etc.
    resource_region VARCHAR(50),
    
    -- Evidence and context
    evidence JSONB, -- Screenshots, logs, configuration dumps
    proof_of_concept TEXT,
    affected_data_types TEXT[],
    
    -- Remediation
    remediation_steps TEXT,
    remediation_complexity VARCHAR(20) DEFAULT 'medium' CHECK (remediation_complexity IN ('easy', 'medium', 'hard')),
    estimated_fix_time_hours INTEGER,
    
    -- Status tracking
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'accepted_risk', 'false_positive')),
    assigned_to UUID REFERENCES users(id),
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolution_notes TEXT,
    
    -- Compliance mapping
    compliance_frameworks TEXT[], -- Which frameworks this finding affects
    regulatory_impact TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Prevent duplicate findings
    UNIQUE(scan_id, finding_type, resource_identifier)
);

-- Data breach alerts and notifications
CREATE TABLE breach_alerts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    application_id UUID REFERENCES applications(id) ON DELETE SET NULL,
    
    -- Breach information
    breach_title VARCHAR(255) NOT NULL,
    breach_description TEXT,
    breach_date TIMESTAMP WITH TIME ZONE NOT NULL,
    discovery_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Severity and impact
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    affected_users_count BIGINT,
    affected_data_types TEXT[] NOT NULL,
    
    -- Source information
    source VARCHAR(100), -- 'HaveIBeenPwned', 'vendor_notification', 'security_research'
    external_reference VARCHAR(500), -- URL to breach notification, CVE, etc.
    
    -- Organization impact
    organization_affected BOOLEAN DEFAULT FALSE,
    estimated_exposure_level VARCHAR(20) DEFAULT 'unknown' CHECK (estimated_exposure_level IN ('none', 'low', 'medium', 'high', 'critical', 'unknown')),
    
    -- Response status
    status VARCHAR(20) DEFAULT 'new' CHECK (status IN ('new', 'investigating', 'confirmed', 'mitigated', 'resolved')),
    response_actions TEXT[], -- ['password_reset', 'user_notification', 'account_lockdown']
    response_notes TEXT,
    assigned_to UUID REFERENCES users(id),
    
    -- Notifications
    users_notified BOOLEAN DEFAULT FALSE,
    notification_sent_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- Compliance frameworks and requirements
CREATE TABLE compliance_frameworks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    
    -- Framework info
    code VARCHAR(20) UNIQUE NOT NULL, -- 'gdpr', 'sox', 'iso27001', 'hipaa'
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50), -- 'privacy', 'financial', 'security', 'healthcare'
    
    -- Requirements
    requirements JSONB, -- Detailed requirements and controls
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Organization compliance status
CREATE TABLE organization_compliance (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    framework_id UUID REFERENCES compliance_frameworks(id) ON DELETE CASCADE,
    
    -- Compliance status
    status VARCHAR(20) DEFAULT 'not_assessed' CHECK (status IN ('not_assessed', 'non_compliant', 'partially_compliant', 'compliant', 'certified')),
    compliance_score INTEGER DEFAULT 0, -- 0-100
    last_assessment_date TIMESTAMP WITH TIME ZONE,
    next_assessment_due TIMESTAMP WITH TIME ZONE,
    
    -- Requirements tracking
    total_requirements INTEGER DEFAULT 0,
    met_requirements INTEGER DEFAULT 0,
    
    -- Evidence and documentation
    evidence_files TEXT[], -- URLs to uploaded evidence
    assessment_notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(organization_id, framework_id)
);

-- User activity and audit log
CREATE TABLE audit_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Action details
    action VARCHAR(100) NOT NULL, -- 'login', 'scan_initiated', 'finding_resolved', 'user_invited'
    entity_type VARCHAR(50), -- 'user', 'application', 'finding', 'integration'
    entity_id UUID, -- Generic reference to any entity
    
    -- Context
    description TEXT,
    metadata JSONB, -- Additional context data
    ip_address INET,
    user_agent TEXT,
    
    -- Risk assessment
    risk_level VARCHAR(20) DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Notification preferences and delivery
CREATE TABLE notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Notification details
    type VARCHAR(50) NOT NULL, -- 'breach_alert', 'scan_complete', 'compliance_deadline'
    title VARCHAR(255) NOT NULL,
    message TEXT,
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    
    -- Delivery
    channels TEXT[] DEFAULT ARRAY['email'], -- ['email', 'slack', 'webhook', 'sms']
    delivery_status VARCHAR(20) DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'sent', 'delivered', 'failed')),
    delivered_at TIMESTAMP WITH TIME ZONE,
    
    -- User interaction
    read_at TIMESTAMP WITH TIME ZONE,
    clicked_at TIMESTAMP WITH TIME ZONE,
    
    -- Related entities
    related_entity_type VARCHAR(50),
    related_entity_id UUID,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE
);

-- API keys and webhooks for integrations
CREATE TABLE api_keys (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    created_by UUID REFERENCES users(id),
    
    -- Key details
    name VARCHAR(255) NOT NULL,
    key_hash VARCHAR(255) NOT NULL UNIQUE, -- Hashed API key
    key_prefix VARCHAR(20) NOT NULL, -- First few characters for identification
    
    -- Permissions
    scopes TEXT[] DEFAULT ARRAY['read'], -- ['read', 'write', 'admin']
    allowed_ips TEXT[], -- IP whitelist
    
    -- Usage tracking
    last_used_at TIMESTAMP WITH TIME ZONE,
    usage_count BIGINT DEFAULT 0,
    rate_limit_per_minute INTEGER DEFAULT 60,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_organizations_slug ON organizations(slug);
CREATE INDEX idx_organizations_subscription_status ON organizations(subscription_status);
CREATE INDEX idx_users_organization_id ON users(organization_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_cloud_integrations_org_provider ON cloud_integrations(organization_id, provider);
CREATE INDEX idx_applications_organization_id ON applications(organization_id);
CREATE INDEX idx_applications_risk_level ON applications(risk_level);
CREATE INDEX idx_security_scans_organization_id ON security_scans(organization_id);
CREATE INDEX idx_security_scans_status ON security_scans(status);
CREATE INDEX idx_security_findings_organization_id ON security_findings(organization_id);
CREATE INDEX idx_security_findings_severity ON security_findings(severity);
CREATE INDEX idx_security_findings_status ON security_findings(status);
CREATE INDEX idx_breach_alerts_organization_id ON breach_alerts(organization_id);
CREATE INDEX idx_breach_alerts_severity ON breach_alerts(severity);
CREATE INDEX idx_audit_logs_organization_id ON audit_logs(organization_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read_at ON notifications(read_at);

-- Sample compliance frameworks
INSERT INTO compliance_frameworks (code, name, description, category, requirements, is_active) VALUES
('gdpr', 'General Data Protection Regulation', 'EU data protection and privacy regulation', 'privacy', 
 '{"articles": ["data_protection_by_design", "consent", "right_to_be_forgotten", "data_portability", "breach_notification"]}', true),
('sox', 'Sarbanes-Oxley Act', 'US financial reporting and corporate governance', 'financial',
 '{"sections": ["internal_controls", "financial_reporting", "audit_requirements", "data_retention"]}', true),
('iso27001', 'ISO 27001', 'Information security management standard', 'security',
 '{"controls": ["access_control", "incident_management", "business_continuity", "risk_assessment"]}', true),
('hipaa', 'Health Insurance Portability and Accountability Act', 'US healthcare data privacy', 'healthcare',
 '{"safeguards": ["administrative", "physical", "technical", "breach_notification"]}', true);

-- Update triggers for timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cloud_integrations_updated_at BEFORE UPDATE ON cloud_integrations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON applications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_security_scans_updated_at BEFORE UPDATE ON security_scans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_security_findings_updated_at BEFORE UPDATE ON security_findings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_breach_alerts_updated_at BEFORE UPDATE ON breach_alerts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_organization_compliance_updated_at BEFORE UPDATE ON organization_compliance FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON notifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_api_keys_updated_at BEFORE UPDATE ON api_keys FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();