import type { ThrottlerStorage } from '@nestjs/throttler';
import { describe, expect, it, vi } from 'vitest';
import type { ConvertJwtToAuthUserService } from '../../users/convert-jwt-to-auth-user.service';
import type ConfigurationService from '../config/configuration.service';
import { ContextStoreService } from '../context/context.service';
import { getClientIp, TrpcService } from './trpc.service';

describe('getClientIp', () => {
  it('uses the address resolved by Express, ignoring raw forwarded headers', () => {
    const req = {
      headers: { 'x-forwarded-for': '203.0.113.7, 198.51.100.1' },
      ip: '192.0.2.5',
    };
    expect(getClientIp(req)).toBe('192.0.2.5');
  });

  it('normalizes IPv4 mapped addresses', () => {
    expect(getClientIp({ ip: '::ffff:192.0.2.5' })).toBe('192.0.2.5');
  });

  it('groups IPv6 addresses in the same /64', () => {
    const first = getClientIp({ ip: '2001:db8:1234:5678::1' });
    const second = getClientIp({ ip: '2001:db8:1234:5678::2' });
    expect(first).toBe(second);
    expect(first).not.toBe(getClientIp({ ip: '2001:db8:1234:5679::1' }));
  });

  it('does not use forwarded headers when Express has no address', () => {
    expect(getClientIp({ ip: undefined })).toBeUndefined();
  });
});

describe('tRPC rate limits', () => {
  const createCaller = (isBlocked: boolean) => {
    const increment = vi.fn().mockResolvedValue({
      totalHits: 0,
      timeToExpire: 60,
      isBlocked,
      timeToBlockExpire: 60,
    });
    const service = new TrpcService(
      new ContextStoreService(),
      {} as ConvertJwtToAuthUserService,
      {} as ConfigurationService,
      { increment } as ThrottlerStorage
    );
    const router = service.router({
      contact: service.publicProcedure
        .use(service.rateLimit({ name: 'contact', limit: 2, ttl: 60_000 }))
        .query(() => 'accepted'),
    });
    return {
      caller: router.createCaller({ user: null, clientIp: '192.0.2.5' }),
      increment,
    };
  };

  it('honors the storage block even when the hit counter has expired', async () => {
    const { caller, increment } = createCaller(true);
    await expect(caller.contact()).rejects.toMatchObject({
      code: 'TOO_MANY_REQUESTS',
    });
    expect(increment).toHaveBeenCalledWith(
      'trpc:contact:192.0.2.5',
      60_000,
      2,
      60_000,
      'contact'
    );
  });

  it('allows requests accepted by shared storage', async () => {
    const { caller } = createCaller(false);
    await expect(caller.contact()).resolves.toBe('accepted');
  });
});
