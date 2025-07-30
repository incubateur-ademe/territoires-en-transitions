import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  generateAppCSP,
  generateCSPHeader,
  getBaseCSPDirectives,
  mergeSources,
  type AppCSPConfig,
  type CSPDirectives,
} from './csp-config';

const nonce = Buffer.from(crypto.randomUUID()).toString('base64');

describe('CSP Configuration', () => {
  let mockRequest: NextRequest;

  beforeEach(() => {
    mockRequest = {
      nextUrl: {
        host: 'localhost:3000',
      },
    } as NextRequest;
  });

  describe('getBaseCSPDirectives', () => {
    it('should return base directives for development', () => {
      const directives = getBaseCSPDirectives({
        isDevelopment: true,
        nonce,
      });

      expect(directives['default-src']).toEqual(["'self'"]);
      expect(directives['script-src']).toContain("'unsafe-eval'");
      expect(directives['script-src']).toContain("'unsafe-inline'");
      expect(directives['connect-src']).toContain(`'self'`);
      expect(directives['upgrade-insecure-requests']).toBe(false);
      expect(directives['block-all-mixed-content']).toBe(true);
    });

    it('should return base directives for production', () => {
      const directives = getBaseCSPDirectives({
        isDevelopment: false,
        nonce,
      });

      expect(directives['default-src']).toEqual(["'self'"]);
      expect(directives['script-src']).not.toContain("'unsafe-eval'");
      expect(directives['script-src']).not.toContain("'unsafe-inline'");
      expect(directives['connect-src']).toContain(`'self'`);
      expect(directives['upgrade-insecure-requests']).toBe(true);
      expect(directives['block-all-mixed-content']).toBe(true);
    });
  });

  describe('mergeSources', () => {
    it('should merge arrays and remove duplicates', () => {
      const result = mergeSources(['a', 'b'], ['b', 'c'], ['a', 'd']);

      expect(result).toEqual(['a', 'b', 'c', 'd']);
    });

    it('should handle empty arrays', () => {
      const result = mergeSources([], ['a'], []);
      expect(result).toEqual(['a']);
    });
  });

  describe('generateCSPHeader', () => {
    it('should generate valid CSP header', () => {
      const directives: CSPDirectives = {
        'default-src': ["'self'"],
        'script-src': ["'self'", "'unsafe-inline'"],
      };

      const header = generateCSPHeader(directives);

      expect(header).toContain("default-src 'self'");
      expect(header).toContain("script-src 'self' 'unsafe-inline'");
    });
  });

  describe('generateAppCSP', () => {
    it('should generate CSP with base configuration', () => {
      const { cspHeader, nonce } = generateAppCSP(mockRequest);

      expect(cspHeader).toBeDefined();
      expect(nonce).toBeDefined();
      expect(cspHeader).toContain("default-src 'self'");
      expect(cspHeader).toMatch(
        /script-src 'self' 'nonce-.*' 'strict-dynamic'/
      );
      expect(cspHeader).toContain('upgrade-insecure-requests');
    });

    it('should merge additional directives', () => {
      const appConfig: AppCSPConfig = {
        additionalDirectives: {
          'script-src': ['*.posthog.com'],
          'connect-src': ['*.posthog.com'],
        },
      };

      const { cspHeader } = generateAppCSP(mockRequest, appConfig);

      expect(cspHeader).toContain('*.posthog.com');
    });

    it('should apply dynamic directives', () => {
      const appConfig: AppCSPConfig = {
        dynamicDirectives: (request) => ({
          'connect-src': [`ws://${request.nextUrl.host}`],
        }),
      };

      const { cspHeader } = generateAppCSP(mockRequest, appConfig);

      expect(cspHeader).toContain('ws://localhost:3000');
    });

    it('should merge all directive types correctly', () => {
      const appConfig: AppCSPConfig = {
        additionalDirectives: {
          'script-src': ['*.posthog.com'],
        },
        dynamicDirectives: (request) => ({
          'connect-src': [`ws://${request.nextUrl.host}`],
        }),
      };

      const { cspHeader } = generateAppCSP(mockRequest, appConfig);

      expect(cspHeader).toContain('*.posthog.com');
      expect(cspHeader).toContain('ws://localhost:3000');
    });

    it('should handle development vs production environments', () => {
      const originalEnv = process.env.NODE_ENV;

      // Test development
      process.env.NODE_ENV = 'development';
      const devResult = generateAppCSP(mockRequest);
      expect(devResult.cspHeader).toContain("'unsafe-eval'");

      // Test production
      process.env.NODE_ENV = 'production';
      const prodResult = generateAppCSP(mockRequest);
      expect(prodResult.cspHeader).not.toContain("'unsafe-eval'");
      expect(prodResult.cspHeader).toContain('upgrade-insecure-requests');

      // Restore original environment
      process.env.NODE_ENV = originalEnv;
    });
  });
});
