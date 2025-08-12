// System Health Check Endpoint
// Provides real-time system status and diagnostics

import { HealthMonitor } from '../lib/health-monitor.js';
import { validateToken } from '../lib/auth.js';
import { Logger } from '../lib/logger.js';

const logger = new Logger('health-api');
const healthMonitor = new HealthMonitor();

/**
 * Health check endpoint
 * Returns system status and recent metrics
 */
export default async function handler(req, res) {
  const startTime = Date.now();
  
  try {
    // Support both GET and POST
    if (!['GET', 'POST'].includes(req.method)) {
      return res.status(405).json({ 
        error: 'Method not allowed',
        allowed: ['GET', 'POST']
      });
    }

    // Optional authentication (public health check)
    let auth = null;
    if (req.headers.authorization) {
      auth = await validateToken(req.headers.authorization);
    }

    // Perform comprehensive health check
    const healthResults = await healthMonitor.performHealthCheck();
    
    // Add response time
    const responseTime = Date.now() - startTime;
    healthResults.api = {
      responseTime,
      status: responseTime < 1000 ? 'healthy' : 'slow'
    };

    // Determine overall status
    const overallStatus = determineOverallStatus(healthResults);
    
    // Log health check
    logger.info('Health check performed', {
      status: overallStatus,
      responseTime,
      authenticated: !!auth
    });

    // Return appropriate status code
    const statusCode = overallStatus === 'healthy' ? 200 : 
                      overallStatus === 'degraded' ? 200 : 503;

    return res.status(statusCode).json({
      status: overallStatus,
      timestamp: new Date().toISOString(),
      responseTime,
      checks: healthResults,
      version: process.env.npm_package_version || '2.0.0',
      ...(auth && auth.valid ? { 
        authenticated: true,
        org: auth.org 
      } : {})
    });

  } catch (error) {
    logger.error('Health check failed', {
      error: error.message,
      stack: error.stack
    });

    return res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
      message: error.message
    });
  }
}

/**
 * Determine overall system status from individual checks
 */
function determineOverallStatus(healthResults) {
  const checks = Object.values(healthResults);
  
  // If any critical check fails, system is unhealthy
  if (checks.some(check => check.status === 'unhealthy' && check.critical)) {
    return 'unhealthy';
  }
  
  // If any check is degraded, system is degraded
  if (checks.some(check => check.status === 'degraded')) {
    return 'degraded';
  }
  
  // If any non-critical check fails, system is degraded
  if (checks.some(check => check.status === 'unhealthy')) {
    return 'degraded';
  }
  
  // All checks passed
  return 'healthy';
}
