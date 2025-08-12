// AI-Managed Universal Notification API Endpoint
// Handles intelligent notification routing with AI analysis

import { validateToken, extractRequestInfo } from '../lib/auth.js';
import { AIConfigManager } from '../lib/ai-config-manager.js';
import { NotificationRouter } from '../lib/notification-router.js';
import { DebugAnalyzer } from '../lib/debug-analyzer.js';
import { HealthMonitor } from '../lib/health-monitor.js';
import { Logger } from '../lib/logger.js';

const logger = new Logger('notify-api');
const aiConfig = new AIConfigManager();
const notificationRouter = new NotificationRouter();
const debugAnalyzer = new DebugAnalyzer();
const healthMonitor = new HealthMonitor();

/**
 * Main notification endpoint
 * Accepts webhook calls from GitHub Actions and routes notifications intelligently
 */
export default async function handler(req, res) {
  const startTime = Date.now();
  
  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return res.status(405).json({ 
        error: 'Method not allowed',
        allowed: ['POST']
      });
    }

    // Extract request information
    const requestInfo = extractRequestInfo(req);
    logger.info('Notification request received', requestInfo);

    // 1. Authentication
    const auth = await validateToken(req.headers.authorization);
    if (!auth.valid) {
      logger.warn('Authentication failed', { ip: requestInfo.ip });
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'Invalid or missing authentication token'
      });
    }

    // 2. Parse and validate request body
    const {
      status,
      message,
      title = '',
      details = '',
      repository = '',
      branch = '',
      target = '',
      workflow_url = '',
      context = {}
    } = req.body;

    // Validate required fields
    if (!status || !message) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Missing required fields: status, message'
      });
    }

    if (!['success', 'error', 'warning', 'info'].includes(status)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid status. Must be: success, error, warning, info'
      });
    }

    // 3. Prepare notification payload
    const notificationPayload = {
      status,
      message,
      title,
      details,
      repository,
      branch,
      target,
      workflow_url,
      context,
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: requestInfo.id,
        source: 'api',
        org: auth.org,
        userId: auth.userId
      }
    };

    // 4. AI-powered notification rule evaluation
    const aiConfig = await aiConfig.getOptimizedConfig(auth.org);
    const shouldNotify = await evaluateNotificationNeed(
      notificationPayload, 
      aiConfig,
      auth.org
    );

    logger.info('AI evaluation completed', { 
      shouldNotify, 
      configVersion: aiConfig.version 
    });

    // 5. Collect debug information
    const debugInfo = await debugAnalyzer.collectDebugInfo(
      notificationPayload,
      requestInfo
    );

    // 6. Send notifications if needed
    let notificationResults = [];
    if (shouldNotify) {
      notificationResults = await notificationRouter.sendNotifications(
        notificationPayload,
        aiConfig.channels,
        debugInfo
      );
      
      logger.info('Notifications sent', { 
        channels: notificationResults.map(r => r.channel),
        success: notificationResults.filter(r => r.success).length,
        failed: notificationResults.filter(r => !r.success).length
      });
    }

    // 7. Log metrics for AI learning
    await logger.logUsageMetrics({
      org: auth.org,
      repository,
      status,
      aiDecision: shouldNotify,
      notificationResults,
      processingTime: Date.now() - startTime,
      debugInfo
    });

    // 8. Health monitoring
    await healthMonitor.recordHealthMetric({
      endpoint: 'notify',
      success: true,
      responseTime: Date.now() - startTime,
      org: auth.org
    });

    // 9. Return response
    return res.status(200).json({
      success: true,
      message: 'Notification processed',
      data: {
        notified: shouldNotify,
        channels: notificationResults.map(r => ({ 
          channel: r.channel, 
          success: r.success 
        })),
        aiConfig: {
          version: aiConfig.version,
          lastOptimized: aiConfig.lastOptimized
        },
        processingTime: Date.now() - startTime,
        requestId: requestInfo.id
      }
    });

  } catch (error) {
    logger.error('Notification processing failed', {
      error: error.message,
      stack: error.stack,
      processingTime: Date.now() - startTime
    });

    // Notify system error to admin channels
    await notificationRouter.notifySystemError(error, {
      endpoint: 'notify',
      processingTime: Date.now() - startTime
    }).catch(() => {}); // Don't fail the response if error notification fails

    // Health monitoring for errors
    await healthMonitor.recordHealthMetric({
      endpoint: 'notify',
      success: false,
      error: error.message,
      responseTime: Date.now() - startTime
    }).catch(() => {});

    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to process notification',
      requestId: extractRequestInfo(req).id
    });
  }
}

/**
 * AI-powered notification need evaluation
 * Uses Claude API to determine if notification should be sent
 */
async function evaluateNotificationNeed(payload, config, org) {
  try {
    // Simple rule-based evaluation for now
    // TODO: Implement Claude API integration
    
    // Always notify errors
    if (payload.status === 'error') {
      return true;
    }
    
    // Apply frequency rules for success notifications
    if (payload.status === 'success') {
      // Check if similar notification was sent recently
      const recentSimilar = await checkRecentNotifications(payload, org);
      if (recentSimilar && config.deduplication.enabled) {
        return false;
      }
    }
    
    // Default: send notification
    return true;
    
  } catch (error) {
    logger.warn('AI evaluation failed, defaulting to send', { error: error.message });
    return true; // Default to sending notification if AI evaluation fails
  }
}

/**
 * Check for recent similar notifications to prevent spam
 */
async function checkRecentNotifications(payload, org) {
  // TODO: Implement with database/cache
  // For now, return false (no recent notifications)
  return false;
}
