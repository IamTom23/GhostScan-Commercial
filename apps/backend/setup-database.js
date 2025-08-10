#!/usr/bin/env node

/**
 * Database Setup Script for GhostScan Backend
 * This script will:
 * 1. Test database connection
 * 2. Run schema if needed
 * 3. Create initial admin user
 */

const { Pool } = require('pg');
require('dotenv').config();

const config = {
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  database: process.env.DATABASE_NAME || 'ghostscan_security',
  user: process.env.DATABASE_USER || 'ghostscan',
  password: process.env.DATABASE_PASSWORD || '',
};

// Add SSL for production
if (process.env.NODE_ENV === 'production' && process.env.DATABASE_URL) {
  // Use DATABASE_URL for production (Heroku, Railway, etc.)
  config.connectionString = process.env.DATABASE_URL;
  config.ssl = {
    rejectUnauthorized: false
  };
}

async function main() {
  console.log('🚀 GhostScan Database Setup');
  console.log('=====================================');
  
  const pool = new Pool(config);

  try {
    // Test connection
    console.log('🔍 Testing database connection...');
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as current_time, version() as version');
    client.release();
    
    console.log('✅ Database connected successfully!');
    console.log(`   Time: ${result.rows[0].current_time}`);
    console.log(`   PostgreSQL: ${result.rows[0].version.split(' ')[0]}`);
    
    // Check if tables exist
    console.log('\n🔍 Checking database schema...');
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('organizations', 'users', 'applications')
    `);
    
    if (tablesResult.rows.length === 0) {
      console.log('⚠️  Database schema not found.');
      console.log('   Please run the schema file:');
      console.log('   psql -U ghostscan -d ghostscan_security -f ../../../dashboard/database/schema.sql');
    } else {
      console.log(`✅ Found ${tablesResult.rows.length} core tables`);
      
      // Check for existing data
      const orgCount = await pool.query('SELECT COUNT(*) FROM organizations');
      const userCount = await pool.query('SELECT COUNT(*) FROM users');
      
      console.log(`   Organizations: ${orgCount.rows[0].count}`);
      console.log(`   Users: ${userCount.rows[0].count}`);
    }
    
  } catch (error) {
    console.error('❌ Database setup failed:');
    console.error('   Error:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('   → Is PostgreSQL running?');
      console.error('   → Check connection details in .env file');
    } else if (error.code === '28P01') {
      console.error('   → Check username/password in .env file');
    } else if (error.code === '3D000') {
      console.error('   → Database "ghostscan_security" does not exist');
      console.error('   → Create it with: CREATE DATABASE ghostscan_security;');
    }
    
    process.exit(1);
  } finally {
    await pool.end();
  }
  
  console.log('\n🎉 Database setup complete!');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };