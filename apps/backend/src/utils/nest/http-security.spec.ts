import { createBullBoard } from '@bull-board/api';
import { ExpressAdapter } from '@bull-board/express';
import { Controller, Get, Req } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Test } from '@nestjs/testing';
import type { Request, Response } from 'express';
import request from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';
import { z } from 'zod';
import {
  httpSecurityConfiguration,
  httpUrlSchema,
} from '../config/http-security.configuration';
import { configureHttpSecurity } from './http-security';

@Controller()
class SecurityTestController {
  @Get('client-ip')
  clientIp(@Req() req: Request) {
    return { ip: req.ip };
  }
}

const config = {
  APP_URL: 'https://app.example.test',
  SITE_URL: 'https://site.example.test',
  HTTP_ALLOWED_ORIGINS: ['https://partner.example.test'],
  TRUST_PROXY_HOPS: 0,
};

describe('HTTP security configuration', () => {
  const schema = z.object({
    ...httpSecurityConfiguration,
    APP_URL: httpUrlSchema.optional(),
  });

  it('normalizes explicit origins and defaults to no trusted proxy', () => {
    expect(
      schema.parse({
        SITE_URL: 'https://Site.Example.test:443',
        HTTP_ALLOWED_ORIGINS:
          'https://Partner.Example.test:443,http://localhost:3000',
      })
    ).toEqual({
      SITE_URL: 'https://site.example.test',
      HTTP_ALLOWED_ORIGINS: [
        'https://partner.example.test',
        'http://localhost:3000',
      ],
      TRUST_PROXY_HOPS: 0,
    });
  });

  it('accepts HTTP application URLs with a base path', () => {
    expect(
      schema.parse({ APP_URL: 'https://app.example.test/platform/' }).APP_URL
    ).toBe('https://app.example.test/platform/');
  });

  it.each([
    'ftp://example.test',
    'file:///tmp/app',
    'javascript:alert(1)',
    'https://user:password@example.test',
    'not-a-url',
  ])('rejects invalid APP_URL %s', (APP_URL) => {
    expect(schema.safeParse({ APP_URL }).success).toBe(false);
  });

  it.each([
    'https://example.test/',
    'https://example.test/path',
    'https://user:password@example.test',
    'https://*.example.test',
    'https://example.test?query=1',
    'https://example.test#fragment',
    'null',
    'file://example.test',
  ])('rejects invalid origin %s', (origin) => {
    expect(schema.safeParse({ HTTP_ALLOWED_ORIGINS: origin }).success).toBe(
      false
    );
  });

  it.each([-1, 1.5, 11, 'all'])(
    'rejects unsafe proxy hop setting %s',
    (hops) => {
      expect(schema.safeParse({ TRUST_PROXY_HOPS: hops }).success).toBe(false);
    }
  );
});

describe('HTTP security boundaries', () => {
  let app: NestExpressApplication | undefined;
  afterEach(async () => {
    await app?.close();
  });

  async function createApp(isProduction = false, trustProxyHops = 0) {
    const module = await Test.createTestingModule({
      controllers: [SecurityTestController],
    }).compile();
    app = module.createNestApplication<NestExpressApplication>();
    configureHttpSecurity(
      app,
      { ...config, TRUST_PROXY_HOPS: trustProxyHops },
      isProduction
    );
    app.use('/trpc', (_req: Request, res: Response) =>
      res.json({ accepted: true })
    );
    app.use('/oidc/callback', (_req: Request, res: Response) =>
      res.json({ accepted: true })
    );
    const adapter = new ExpressAdapter();
    adapter.setBasePath('/queues');
    createBullBoard({ queues: [], serverAdapter: adapter });
    app.use('/queues', adapter.getRouter());
    SwaggerModule.setup(
      'api-docs/v1',
      app,
      SwaggerModule.createDocument(
        app,
        new DocumentBuilder().setTitle('test').setVersion('1').build()
      )
    );
    await app.init();
    return request(app.getHttpServer());
  }

  it.each([config.APP_URL, config.SITE_URL, ...config.HTTP_ALLOWED_ORIGINS])(
    'allows credentialed tRPC from %s',
    async (origin) => {
      const http = await createApp();
      const response = await http
        .post('/trpc')
        .set('Origin', origin)
        .set('Sec-Fetch-Site', 'cross-site')
        .set('Cookie', 'session=test');
      expect(response.status).toBe(200);
      expect(response.headers['access-control-allow-origin']).toBe(origin);
      expect(response.headers['access-control-allow-credentials']).toBe('true');
    }
  );

  it('rejects cross-site mutations before raw Express handlers', async () => {
    const http = await createApp();
    const response = await http
      .post('/trpc')
      .set('Origin', 'https://evil.example.test')
      .set('Sec-Fetch-Site', 'cross-site')
      .set('Cookie', 'session=test');
    expect(response.status).toBe(403);
    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('does not implicitly trust sibling domains', async () => {
    const http = await createApp();
    const response = await http
      .post('/trpc')
      .set('Origin', 'https://other.example.test')
      .set('Sec-Fetch-Site', 'same-site');
    expect(response.status).toBe(403);
  });

  it('permits server-to-server requests without browser origin metadata', async () => {
    const http = await createApp();
    expect(
      (await http.post('/trpc').set('Authorization', 'Bearer test')).status
    ).toBe(200);
  });

  it('permits safe cross-site OIDC navigation', async () => {
    const http = await createApp();
    expect(
      (
        await http
          .get('/oidc/callback?code=test&state=test')
          .set('Sec-Fetch-Site', 'cross-site')
      ).status
    ).toBe(200);
  });

  it('restricts preflight origins to the exact allowlist', async () => {
    const http = await createApp();
    const allowed = await http
      .options('/trpc')
      .set('Origin', config.APP_URL)
      .set('Access-Control-Request-Method', 'POST');
    expect(allowed.headers['access-control-allow-origin']).toBe(config.APP_URL);
    const denied = await http
      .options('/trpc')
      .set('Origin', 'https://app.example.test.evil.test')
      .set('Access-Control-Request-Method', 'POST');
    expect(denied.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('ignores forged forwarded addresses without a trusted proxy', async () => {
    const http = await createApp();
    const response = await http
      .get('/client-ip')
      .set('X-Forwarded-For', '203.0.113.1');
    expect(response.body.ip).not.toBe('203.0.113.1');
  });

  it('trusts only the last forwarded address behind Koyeb', async () => {
    const http = await createApp(false, 1);
    const response = await http
      .get('/client-ip')
      .set('X-Forwarded-For', '203.0.113.1, 198.51.100.7');
    expect(response.body.ip).toBe('198.51.100.7');
  });

  it.each([false, true])(
    'serves Swagger and Bull Board assets under enforced CSP (production=%s)',
    async (isProduction) => {
      const http = await createApp(isProduction);
      for (const path of ['/api-docs/v1/', '/queues/']) {
        const response = await http.get(path);
        expect(response.status).toBe(200);
        const csp = response.headers['content-security-policy'];
        expect(csp).toContain("script-src 'self'");
        expect(csp.includes('upgrade-insecure-requests')).toBe(isProduction);
        expect(Boolean(response.headers['strict-transport-security'])).toBe(
          isProduction
        );
        const scripts = [
          ...response.text.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi),
        ];
        expect(scripts.length).toBeGreaterThan(0);
        for (const [, attributes, content] of scripts) {
          const source = attributes.match(/src="([^"]+)"/i)?.[1];
          if (!source) {
            // Inert application/json script tags do not execute under CSP.
            expect(attributes).toMatch(/type="application\/json"/);
            continue;
          }
          expect(content.trim()).toBe('');
          const asset = new URL(source, `http://localhost${path}`);
          expect(asset.origin).toBe('http://localhost');
          expect((await http.get(asset.pathname)).status).toBe(200);
        }
      }
    }
  );
});
