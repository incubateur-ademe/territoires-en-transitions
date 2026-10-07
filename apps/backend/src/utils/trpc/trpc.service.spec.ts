import type { Request } from 'express';
import { describe, expect, it } from 'vitest';
import { getClientIp } from './trpc.service';

const buildRequest = (
  headers: Record<string, string | string[]>,
  ip?: string
): Request => ({ headers, ip } as unknown as Request);

describe('getClientIp', () => {
  it("retient la première entrée de x-forwarded-for : c'est le client, les suivantes sont les proxies", () => {
    const req = buildRequest(
      { 'x-forwarded-for': '203.0.113.7, 198.51.100.1, 10.0.0.3' },
      '10.0.0.3'
    );

    expect(getClientIp(req)).toBe('203.0.113.7');
  });

  it('tolère les espaces autour des adresses', () => {
    expect(
      getClientIp(buildRequest({ 'x-forwarded-for': '  203.0.113.7  ' }))
    ).toBe('203.0.113.7');
  });

  it("retombe sur req.ip quand l'en-tête est absent", () => {
    expect(getClientIp(buildRequest({}, '192.0.2.5'))).toBe('192.0.2.5');
  });

  it("retombe sur req.ip quand l'en-tête est vide", () => {
    expect(
      getClientIp(buildRequest({ 'x-forwarded-for': '' }, '192.0.2.5'))
    ).toBe('192.0.2.5');
  });

  it('prend le premier en-tête quand Express en expose plusieurs', () => {
    expect(
      getClientIp(
        buildRequest({ 'x-forwarded-for': ['203.0.113.7', '198.51.100.1'] })
      )
    ).toBe('203.0.113.7');
  });

  it("renvoie undefined quand rien n'est disponible — rateLimit retombe alors sur un seau commun", () => {
    expect(getClientIp(buildRequest({}))).toBeUndefined();
  });
});
