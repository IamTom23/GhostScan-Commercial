// Database connection and query utilities for Cloudyx Security Dashboard
import { Pool, QueryResult } from 'pg';

interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  ssl?: {
    rejectUnauthorized: boolean;
  };
}

class Database {
  private pool: Pool | null = null;
  private isConnected = false;

  constructor() {
    this.initializePool();
  }

  private initializePool() {
    try {
      const config: DatabaseConfig = {
        host: process.env.DATABASE_HOST || 'localhost',
        port: parseInt(process.env.DATABASE_PORT || '5432'),
        database: process.env.DATABASE_NAME || 'cloudyx_security',
        user: process.env.DATABASE_USER || 'cloudyx',
        password: process.env.DATABASE_PASSWORD || '',
      };

      // Add SSL for production
      if (process.env.NODE_ENV === 'production') {
        config.ssl = {
          rejectUnauthorized: false
        };
      }

      this.pool = new Pool({
        ...config,
        max: 20, // Maximum number of clients in the pool
        idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
        connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
      });

      // Handle pool events
      this.pool.on('connect', () => {
        console.log('[Database] New client connected to PostgreSQL');
        this.isConnected = true;
      });

      this.pool.on('error', (err) => {
        console.error('[Database] Unexpected error on idle client:', err);
        this.isConnected = false;
      });

      console.log('[Database] PostgreSQL connection pool initialized');
    } catch (error) {
      console.error('[Database] Failed to initialize connection pool:', error);
      this.isConnected = false;
    }
  }

  // Test database connection
  async testConnection(): Promise<{success: boolean; message: string; details?: any}> {
    try {
      if (!this.pool) {
        return {
          success: false,
          message: 'Database pool not initialized'
        };
      }

      const client = await this.pool.connect();
      const result = await client.query('SELECT NOW() as current_time, version() as version');
      client.release();

      return {
        success: true,
        message: 'Database connection successful',
        details: {
          timestamp: result.rows[0].current_time,
          version: result.rows[0].version
        }
      };
    } catch (error) {
      return {
        success: false,
        message: `Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { error: String(error) }
      };
    }
  }

  // Execute a query
  async query(text: string, params?: any[]): Promise<QueryResult> {
    if (!this.pool) {
      throw new Error('Database pool not initialized');
    }

    const client = await this.pool.connect();
    try {
      const start = Date.now();
      const result = await client.query(text, params);
      const duration = Date.now() - start;
      
      console.log('[Database] Query executed:', { 
        text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
        duration: `${duration}ms`,
        rows: result.rowCount 
      });
      
      return result;
    } finally {
      client.release();
    }
  }

  // Close all connections
  async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      console.log('[Database] Connection pool closed');
      this.isConnected = false;
    }
  }

  // Check if database is connected
  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  // Transaction wrapper
  async transaction<T>(callback: (query: (text: string, params?: any[]) => Promise<QueryResult>) => Promise<T>): Promise<T> {
    if (!this.pool) {
      throw new Error('Database pool not initialized');
    }

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      
      const queryFn = (text: string, params?: any[]) => client.query(text, params);
      const result = await callback(queryFn);
      
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

// Data Access Objects (DAOs)

export class OrganizationDAO {
  constructor(private db: Database) {}

  async create(org: {
    name: string;
    slug: string;
    type: 'startup' | 'smb' | 'enterprise';
    employees?: number;
    industry?: string;
    website?: string;
    primaryEmail?: string;
  }) {
    const query = `
      INSERT INTO organizations (name, slug, type, employees, industry, website, primary_email)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    const result = await this.db.query(query, [
      org.name,
      org.slug,
      org.type,
      org.employees,
      org.industry,
      org.website,
      org.primaryEmail
    ]);
    return result.rows[0];
  }

  async findById(id: string) {
    const query = 'SELECT * FROM organizations WHERE id = $1 AND deleted_at IS NULL';
    const result = await this.db.query(query, [id]);
    return result.rows[0] || null;
  }

  async findBySlug(slug: string) {
    const query = 'SELECT * FROM organizations WHERE slug = $1 AND deleted_at IS NULL';
    const result = await this.db.query(query, [slug]);
    return result.rows[0] || null;
  }

  async updateSecurityMetrics(id: string, metrics: {
    securityGrade?: string;
    privacyScore?: number;
    lastScanAt?: Date;
  }) {
    const query = `
      UPDATE organizations 
      SET security_grade = COALESCE($2, security_grade),
          privacy_score = COALESCE($3, privacy_score),
          last_scan_at = COALESCE($4, last_scan_at),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;
    const result = await this.db.query(query, [
      id,
      metrics.securityGrade,
      metrics.privacyScore,
      metrics.lastScanAt
    ]);
    return result.rows[0];
  }

  async getWithStats(id: string) {
    const query = `
      SELECT 
        o.*,
        COUNT(DISTINCT a.id) as total_apps,
        COUNT(DISTINCT CASE WHEN a.risk_level IN ('high', 'critical') THEN a.id END) as high_risk_apps,
        COUNT(DISTINCT ba.id) as total_breach_alerts,
        COUNT(DISTINCT CASE WHEN ba.status = 'new' THEN ba.id END) as new_breach_alerts,
        COUNT(DISTINCT sf.id) as total_findings,
        COUNT(DISTINCT CASE WHEN sf.severity IN ('high', 'critical') THEN sf.id END) as critical_findings
      FROM organizations o
      LEFT JOIN applications a ON o.id = a.organization_id AND a.status = 'active'
      LEFT JOIN breach_alerts ba ON o.id = ba.organization_id
      LEFT JOIN security_findings sf ON o.id = sf.organization_id AND sf.status = 'open'
      WHERE o.id = $1 AND o.deleted_at IS NULL
      GROUP BY o.id
    `;
    const result = await this.db.query(query, [id]);
    return result.rows[0] || null;
  }
}

export class UserDAO {
  constructor(private db: Database) {}

  async create(user: {
    organizationId: string;
    email: string;
    firstName?: string;
    lastName?: string;
    role?: 'owner' | 'admin' | 'security_admin' | 'member' | 'viewer';
  }) {
    const query = `
      INSERT INTO users (organization_id, email, first_name, last_name, role)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const result = await this.db.query(query, [
      user.organizationId,
      user.email,
      user.firstName,
      user.lastName,
      user.role || 'member'
    ]);
    return result.rows[0];
  }

  async findByEmail(email: string) {
    const query = `
      SELECT u.*, o.name as organization_name, o.slug as organization_slug
      FROM users u
      JOIN organizations o ON u.organization_id = o.id
      WHERE u.email = $1 AND u.deleted_at IS NULL
    `;
    const result = await this.db.query(query, [email]);
    return result.rows[0] || null;
  }

  async updateLastLogin(id: string) {
    const query = `
      UPDATE users 
      SET last_login_at = CURRENT_TIMESTAMP,
          login_count = login_count + 1,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `;
    await this.db.query(query, [id]);
  }
}

export class ApplicationDAO {
  constructor(private db: Database) {}

  async findByOrganization(organizationId: string) {
    const query = `
      SELECT 
        a.*,
        ci.provider as cloud_provider,
        COUNT(sf.id) as open_findings_count
      FROM applications a
      LEFT JOIN cloud_integrations ci ON a.cloud_integration_id = ci.id
      LEFT JOIN security_findings sf ON a.id = sf.application_id AND sf.status = 'open'
      WHERE a.organization_id = $1 AND a.status = 'active'
      GROUP BY a.id, ci.provider
      ORDER BY a.risk_level DESC, a.name ASC
    `;
    const result = await this.db.query(query, [organizationId]);
    return result.rows;
  }

  async create(app: {
    organizationId: string;
    name: string;
    domain?: string;
    appType?: string;
    category?: string;
    discoveryMethod: 'oauth_scan' | 'dns_scan' | 'cloud_api' | 'manual' | 'extension';
    riskLevel?: 'low' | 'medium' | 'high' | 'critical';
  }) {
    const query = `
      INSERT INTO applications 
      (organization_id, name, domain, app_type, category, discovery_method, risk_level)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    const result = await this.db.query(query, [
      app.organizationId,
      app.name,
      app.domain,
      app.appType,
      app.category,
      app.discoveryMethod,
      app.riskLevel || 'unknown'
    ]);
    return result.rows[0];
  }
}

export class SecurityScanDAO {
  constructor(private db: Database) {}

  async create(scan: {
    organizationId: string;
    scanType: 'full' | 'quick' | 'targeted' | 'compliance' | 'breach_check';
    triggeredBy?: 'manual' | 'scheduled' | 'onboarding' | 'webhook' | 'api';
  }) {
    const query = `
      INSERT INTO security_scans (organization_id, scan_type, triggered_by, status)
      VALUES ($1, $2, $3, 'pending')
      RETURNING *
    `;
    const result = await this.db.query(query, [
      scan.organizationId,
      scan.scanType,
      scan.triggeredBy || 'manual'
    ]);
    return result.rows[0];
  }

  async updateProgress(id: string, progress: number) {
    const query = `
      UPDATE security_scans 
      SET progress_percentage = $2, 
          status = CASE WHEN $2 >= 100 THEN 'completed' ELSE status END,
          completed_at = CASE WHEN $2 >= 100 THEN CURRENT_TIMESTAMP ELSE completed_at END,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;
    const result = await this.db.query(query, [id, progress]);
    return result.rows[0];
  }

  async getLatestByOrganization(organizationId: string) {
    const query = `
      SELECT * FROM security_scans 
      WHERE organization_id = $1 
      ORDER BY created_at DESC 
      LIMIT 1
    `;
    const result = await this.db.query(query, [organizationId]);
    return result.rows[0] || null;
  }
}

export class BreachAlertDAO {
  constructor(private db: Database) {}

  async findByOrganization(organizationId: string, limit = 10) {
    const query = `
      SELECT 
        ba.*,
        a.name as application_name,
        a.domain as application_domain
      FROM breach_alerts ba
      LEFT JOIN applications a ON ba.application_id = a.id
      WHERE ba.organization_id = $1
      ORDER BY ba.breach_date DESC, ba.created_at DESC
      LIMIT $2
    `;
    const result = await this.db.query(query, [organizationId, limit]);
    return result.rows;
  }

  async create(alert: {
    organizationId: string;
    applicationId?: string;
    breachTitle: string;
    breachDescription?: string;
    breachDate: Date;
    severity: 'low' | 'medium' | 'high' | 'critical';
    affectedDataTypes: string[];
    source?: string;
    externalReference?: string;
  }) {
    const query = `
      INSERT INTO breach_alerts 
      (organization_id, application_id, breach_title, breach_description, breach_date, 
       severity, affected_data_types, source, external_reference)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    const result = await this.db.query(query, [
      alert.organizationId,
      alert.applicationId,
      alert.breachTitle,
      alert.breachDescription,
      alert.breachDate,
      alert.severity,
      alert.affectedDataTypes,
      alert.source,
      alert.externalReference
    ]);
    return result.rows[0];
  }
}

// Singleton database instance
export const database = new Database();

// Data Access Objects
export const organizationDAO = new OrganizationDAO(database);
export const userDAO = new UserDAO(database);
export const applicationDAO = new ApplicationDAO(database);
export const securityScanDAO = new SecurityScanDAO(database);
export const breachAlertDAO = new BreachAlertDAO(database);

export default database;