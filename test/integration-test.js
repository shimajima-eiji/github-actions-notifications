#!/usr/bin/env node
// Integration test suite for AI Notification System
// Tests the complete system end-to-end

import { generateToken } from '../lib/auth.js';
import axios from 'axios';
import fs from 'fs';
import path from 'path';

const TEST_CONFIG = {
  baseUrl: process.env.TEST_BASE_URL || 'http://localhost:3000',
  testOrg: 'test-org',
  testUser: 'integration-test',
  timeout: 30000
};

// Test results tracking
let testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

// Test utilities
function logTest(name, passed, message = '') {
  const result = { name, passed, message, timestamp: new Date().toISOString() };
  testResults.tests.push(result);
  
  if (passed) {
    testResults.passed++;
    console.log(`✅ ${name}`);
  } else {
    testResults.failed++;
    console.log(`❌ ${name}: ${message}`);
  }
}

// Main test runner
async function runTests() {
  console.log('🚀 Starting AI Notification System Integration Tests\n');
  
  await testHealthEndpoint();
  await testAuthenticationSystem();
  await testNotificationEndpoint();
  await testConfigurationLoading();
  
  // Results summary
  console.log('\n📊 Test Results Summary');
  console.log('='.repeat(50));
  console.log(`Total Tests: ${testResults.passed + testResults.failed}`);
  console.log(`Passed: ${testResults.passed}`);
  console.log(`Failed: ${testResults.failed}`);
  console.log(`Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`);
  
  if (testResults.failed > 0) {
    console.log('\n❌ Failed Tests:');
    testResults.tests.filter(t => !t.passed).forEach(test => {
      console.log(`  - ${test.name}: ${test.message}`);
    });
    process.exit(1);
  } else {
    console.log('\n🎉 All tests passed!');
  }
}

async function testHealthEndpoint() {
  console.log('\n🏥 Testing Health Endpoint...');
  
  try {
    const response = await axios.get(`${TEST_CONFIG.baseUrl}/api/health`, {
      timeout: 5000
    });
    
    logTest('Health endpoint returns 200', response.status === 200);
    logTest('Health endpoint returns status', response.data.status !== undefined);
    logTest('Health endpoint returns timestamp', response.data.timestamp !== undefined);
    
  } catch (error) {
    logTest('Health endpoint accessible', false, error.message);
  }
}

async function testAuthenticationSystem() {
  console.log('\n🔐 Testing Authentication System...');
  
  try {
    const tokenResult = generateToken(TEST_CONFIG.testOrg, TEST_CONFIG.testUser);
    logTest('Token generation succeeds', tokenResult.success);
    
    // Test valid token
    const response = await axios.post(
      `${TEST_CONFIG.baseUrl}/api/notify`,
      {
        status: 'info',
        message: 'Auth test',
        repository: 'test-repo',
        branch: 'main'
      },
      {
        headers: { 'Authorization': `Bearer ${tokenResult.token}` },
        timeout: 10000
      }
    );
    
    logTest('Valid token authentication succeeds', response.status === 200);
    
  } catch (error) {
    logTest('Authentication system test', false, error.message);
  }
}

async function testNotificationEndpoint() {
  console.log('\n🔔 Testing Notification Endpoint...');
  
  try {
    const tokenResult = generateToken(TEST_CONFIG.testOrg, TEST_CONFIG.testUser);
    const token = tokenResult.token;
    
    const response = await axios.post(
      `${TEST_CONFIG.baseUrl}/api/notify`,
      {
        status: 'success',
        message: 'Integration test notification',
        details: 'This is a test notification',
        repository: 'test-repo',
        branch: 'main'
      },
      {
        headers: { 'Authorization': `Bearer ${token}` },
        timeout: 15000
      }
    );
    
    logTest('Notification endpoint succeeds', response.status === 200);
    logTest('Response contains success flag', response.data.success === true);
    
  } catch (error) {
    logTest('Notification endpoint test', false, error.message);
  }
}

async function testConfigurationLoading() {
  console.log('\n⚙️ Testing Configuration System...');
  
  try {
    const configPath = path.join(process.cwd(), 'config', 'default.json');
    const configExists = fs.existsSync(configPath);
    logTest('Default config file exists', configExists);
    
    if (configExists) {
      const configContent = fs.readFileSync(configPath, 'utf8');
      const config = JSON.parse(configContent);
      
      logTest('Config has version', config.version !== undefined);
      logTest('Config has notifications section', config.notifications !== undefined);
      logTest('Config has channels section', config.notifications?.channels !== undefined);
    }
    
  } catch (error) {
    logTest('Configuration system test', false, error.message);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runTests().catch(console.error);
}