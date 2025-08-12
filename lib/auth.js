// Authentication and authorization utilities
// Handles token validation and request processing

import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { Logger } from './logger.js';

const logger = new Logger('auth');

/**
 * JWT secret from environment variables
 * In production, this should be a strong, randomly generated secret
 */
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-this';

/**
 * Validate authentication token
 * Supports both Bearer tokens (JWT) and API keys
 */
export async function validateToken(authHeader) {
  try {
    if (!authHeader) {
      return { valid: false, reason: 'No authorization header' };
    }

    // Parse authorization header
    const [type, token] = authHeader.split(' ');
    
    if (type !== 'Bearer' || !token) {
      return { valid: false, reason: 'Invalid authorization format' };
    }

    // Try JWT validation first
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      
      // Check if token is expired
      if (decoded.exp && Date.now() >= decoded.exp * 1000) {
        return { valid: false, reason: 'Token expired' };
      }
      
      return {
        valid: true,
        type: 'jwt',
        org: decoded.org,
        userId: decoded.sub || decoded.userId,
        permissions: decoded.permissions || [],
        exp: decoded.exp
      };
      
    } catch (jwtError) {
      // If JWT validation fails, try API key validation
      const apiKeyResult = await validateApiKey(token);
      if (apiKeyResult.valid) {
        return apiKeyResult;
      }
      
      logger.warn('Token validation failed', { 
        jwtError: jwtError.message,
        apiKeyError: apiKeyResult.reason 
      });
      
      return { 
        valid: false, 
        reason: 'Invalid token' 
      };
    }
    
  } catch (error) {
    logger.error('Authentication error', { error: error.message });
    return { valid: false, reason: 'Authentication error' };
  }
}

/**
 * Validate API key
 * Checks against configured API keys from environment
 */
async function validateApiKey(apiKey) {
  try {
    // Load API keys from environment
    // Format: ORG_NAME:API_KEY,ORG_NAME2:API_KEY2
    const apiKeysConfig = process.env.API_KEYS || '';
    
    if (!apiKeysConfig) {
      return { valid: false, reason: 'No API keys configured' };
    }
    
    const apiKeys = apiKeysConfig.split(',').map(entry => {
      const [org, key] = entry.split(':');
      return { org: org.trim(), key: key.trim() };
    });
    
    // Find matching API key
    const match = apiKeys.find(entry => entry.key === apiKey);
    
    if (!match) {
      return { valid: false, reason: 'API key not found' };
    }
    
    return {
      valid: true,
      type: 'apikey',
      org: match.org,
      userId: `apikey-${match.org}`,
      permissions: ['notify'], // Default permissions for API keys
      exp: null // API keys don't expire
    };
    
  } catch (error) {
    logger.error('API key validation error', { error: error.message });
    return { valid: false, reason: 'API key validation error' };
  }
}

/**
 * Generate JWT token for an organization
 * Used for CLI tools and testing
 */
export function generateToken(org, userId, permissions = ['notify'], expiresIn = '30d') {
  try {
    const payload = {
      org,
      sub: userId,
      permissions,
      iat: Math.floor(Date.now() / 1000),
      iss: 'ai-notification-system'
    };
    
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn });
    
    logger.info('Token generated', { org, userId, permissions });
    
    return {
      success: true,
      token,
      expiresIn,
      org,
      userId
    };
    
  } catch (error) {
    logger.error('Token generation error', { error: error.message });
    throw error;
  }
}

/**
 * Generate API key for an organization
 * Creates a secure random API key
 */
export function generateApiKey(org) {
  try {
    // Generate secure random key
    const apiKey = crypto.randomBytes(32).toString('hex');
    
    logger.info('API key generated', { org });
    
    return {
      success: true,
      apiKey,
      org,
      envFormat: `${org}:${apiKey}`
    };
    
  } catch (error) {
    logger.error('API key generation error', { error: error.message });
    throw error;
  }
}

/**
 * Extract request information for logging and analysis
 */
export function extractRequestInfo(req) {
  return {
    id: crypto.randomUUID(),
    ip: req.headers['x-forwarded-for'] || 
        req.headers['x-real-ip'] || 
        req.connection?.remoteAddress ||
        'unknown',
    userAgent: req.headers['user-agent'] || 'unknown',
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    headers: {
      'content-type': req.headers['content-type'],
      'content-length': req.headers['content-length'],
      'user-agent': req.headers['user-agent']
    }
  };
}

/**
 * Rate limiting check
 * Basic implementation - could be enhanced with Redis
 */
const rateLimitCache = new Map();

export function checkRateLimit(identifier, limit = 100, windowMs = 60000) {
  const now = Date.now();
  const windowStart = now - windowMs;
  
  // Get or create rate limit data for identifier
  if (!rateLimitCache.has(identifier)) {
    rateLimitCache.set(identifier, []);
  }
  
  const requests = rateLimitCache.get(identifier);
  
  // Remove old requests outside the window
  const recentRequests = requests.filter(timestamp => timestamp > windowStart);
  
  // Check if limit exceeded
  if (recentRequests.length >= limit) {
    return {
      allowed: false,
      count: recentRequests.length,
      limit,
      resetTime: Math.min(...recentRequests) + windowMs
    };
  }
  
  // Add current request
  recentRequests.push(now);
  rateLimitCache.set(identifier, recentRequests);
  
  return {
    allowed: true,
    count: recentRequests.length,
    limit,
    remaining: limit - recentRequests.length
  };
}

// Clean up old rate limit data periodically
setInterval(() => {
  const now = Date.now();
  const maxAge = 60000 * 60; // 1 hour
  
  for (const [identifier, requests] of rateLimitCache.entries()) {
    const recentRequests = requests.filter(timestamp => timestamp > now - maxAge);
    if (recentRequests.length === 0) {
      rateLimitCache.delete(identifier);
    } else {
      rateLimitCache.set(identifier, recentRequests);
    }
  }
}, 60000 * 10); // Clean up every 10 minutes
