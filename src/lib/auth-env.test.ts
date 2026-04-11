import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getGoogleAuthConfig, isGoogleAuthConfigured } from './auth-env';

describe('Google OAuth Configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should return false for isGoogleAuthConfigured if env vars are missing', () => {
    delete process.env.AUTH_GOOGLE_ID;
    delete process.env.GOOGLE_CLIENT_ID;
    delete process.env.AUTH_GOOGLE_SECRET;
    delete process.env.GOOGLE_CLIENT_SECRET;

    expect(isGoogleAuthConfigured()).toBe(false);
  });

  it('should return true and correct config if AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET are set', () => {
    process.env.AUTH_GOOGLE_ID = 'test-client-id.apps.googleusercontent.com';
    process.env.AUTH_GOOGLE_SECRET = 'test-client-secret';

    expect(isGoogleAuthConfigured()).toBe(true);
    
    const config = getGoogleAuthConfig();
    expect(config.clientId).toBe('test-client-id.apps.googleusercontent.com');
    expect(config.clientSecret).toBe('test-client-secret');
  });

  it('should fallback to GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET', () => {
    delete process.env.AUTH_GOOGLE_ID;
    delete process.env.AUTH_GOOGLE_SECRET;
    
    process.env.GOOGLE_CLIENT_ID = 'fallback-client-id';
    process.env.GOOGLE_CLIENT_SECRET = 'fallback-client-secret';

    expect(isGoogleAuthConfigured()).toBe(true);
    
    const config = getGoogleAuthConfig();
    expect(config.clientId).toBe('fallback-client-id');
    expect(config.clientSecret).toBe('fallback-client-secret');
  });
});
