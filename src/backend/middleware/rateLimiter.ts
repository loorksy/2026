import rateLimit from 'express-rate-limit';

// General API rate limiter
const apiRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: {
    success: false,
    message: 'Too many requests, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Strict rate limiter for authentication endpoints
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per 15 minutes
  message: {
    success: false,
    message: 'Too many login attempts, please try again after 15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true // Don't count successful logins
});

// Rate limiter for password reset
const passwordResetRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 requests per hour
  message: {
    success: false,
    message: 'Too many password reset requests, please try again after an hour'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Rate limiter for email verification resend
const emailVerificationRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 2, // 2 requests per hour
  message: {
    success: false,
    message: 'Too many verification requests, please try again after an hour'
  },
  standardHeaders: true,
  legacyHeaders: false
});

export {
  apiRateLimiter,
  authRateLimiter,
  passwordResetRateLimiter,
  emailVerificationRateLimiter
};
