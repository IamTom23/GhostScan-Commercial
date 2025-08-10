// Supabase client configuration for GhostScan backend
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error('Missing SUPABASE_URL environment variable');
}

if (!supabaseServiceRoleKey) {
  throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
}

// Admin client with service role key (for backend operations)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Public client with anon key (for frontend-compatible operations)
export const supabase = createClient(supabaseUrl, supabaseAnonKey || '', {
  auth: {
    autoRefreshToken: true,
    persistSession: true
  }
});

// Database client (using admin for all database operations)
export const db = supabaseAdmin;

// Helper function to check Supabase connection
export async function testSupabaseConnection() {
  try {
    const { data, error } = await db
      .from('organizations')
      .select('*')
      .limit(1);
    
    if (error) {
      return {
        success: false,
        message: `Supabase connection failed: ${error.message}`,
        details: { error: error.message }
      };
    }
    
    return {
      success: true,
      message: 'Supabase connected successfully',
      details: {
        timestamp: new Date().toISOString(),
        service: 'Supabase PostgreSQL'
      }
    };
  } catch (error) {
    return {
      success: false,
      message: `Supabase connection error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: { error: String(error) }
    };
  }
}

// Organization operations using Supabase
export class SupabaseOrganizationDAO {
  async create(org: {
    name: string;
    slug: string;
    type: 'startup' | 'smb' | 'enterprise';
    employees?: number;
    industry?: string;
    website?: string;
    primaryEmail?: string;
  }) {
    const { data, error } = await db
      .from('organizations')
      .insert({
        name: org.name,
        slug: org.slug,
        type: org.type,
        employees: org.employees,
        industry: org.industry,
        website: org.website,
        primary_email: org.primaryEmail
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create organization: ${error.message}`);
    }

    return data;
  }

  async findById(id: string) {
    const { data, error } = await db
      .from('organizations')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
      throw new Error(`Failed to find organization: ${error.message}`);
    }

    return data;
  }

  async findBySlug(slug: string) {
    const { data, error } = await db
      .from('organizations')
      .select('*')
      .eq('slug', slug)
      .is('deleted_at', null)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
      throw new Error(`Failed to find organization by slug: ${error.message}`);
    }

    return data;
  }

  async updateSecurityMetrics(id: string, metrics: {
    securityGrade?: string;
    privacyScore?: number;
    lastScanAt?: Date;
  }) {
    const { data, error } = await db
      .from('organizations')
      .update({
        security_grade: metrics.securityGrade,
        privacy_score: metrics.privacyScore,
        last_scan_at: metrics.lastScanAt?.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update organization metrics: ${error.message}`);
    }

    return data;
  }

  async getWithStats(id: string) {
    // Use a more complex query to get organization with stats
    const { data, error } = await db
      .rpc('get_organization_with_stats', { org_id: id });

    if (error) {
      // Fallback to basic organization data
      console.warn('Stats query failed, using basic data:', error.message);
      return this.findById(id);
    }

    return data;
  }
}

// User operations using Supabase
export class SupabaseUserDAO {
  async create(user: {
    organizationId: string;
    email: string;
    firstName?: string;
    lastName?: string;
    role?: 'owner' | 'admin' | 'security_admin' | 'member' | 'viewer';
  }) {
    const { data, error } = await db
      .from('users')
      .insert({
        organization_id: user.organizationId,
        email: user.email,
        first_name: user.firstName,
        last_name: user.lastName,
        role: user.role || 'member'
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create user: ${error.message}`);
    }

    return data;
  }

  async findByEmail(email: string) {
    const { data, error } = await db
      .from('users')
      .select(`
        *,
        organizations!inner (
          name,
          slug
        )
      `)
      .eq('email', email)
      .is('deleted_at', null)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to find user by email: ${error.message}`);
    }

    return data;
  }

  async updateLastLogin(id: string) {
    const { error } = await db
      .from('users')
      .update({
        last_login_at: new Date().toISOString(),
        login_count: 1, // Will be properly handled with RPC or trigger
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to update last login: ${error.message}`);
    }
  }

  async updateOAuthProviders(id: string, oauthProviders: any) {
    const { error } = await db
      .from('users')
      .update({
        oauth_providers: oauthProviders,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to update OAuth providers: ${error.message}`);
    }
  }
}

// Export DAO instances
export const supabaseOrganizationDAO = new SupabaseOrganizationDAO();
export const supabaseUserDAO = new SupabaseUserDAO();

export default supabase;