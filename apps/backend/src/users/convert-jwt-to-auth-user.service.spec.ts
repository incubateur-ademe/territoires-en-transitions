import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { generateKeyPairSync, randomUUID } from 'node:crypto';
import { sign } from 'jsonwebtoken';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ConfigurationService from '../utils/config/configuration.service';
import { ConvertJwtToAuthUserService } from './convert-jwt-to-auth-user.service';
import { AuthRole } from './models/auth.models';
import { SupabaseSigningKeysService } from './supabase-signing-keys.service';

const SECRET = 'super-secret-jwt-token-with-at-least-32-characters';
const SUPABASE_URL = 'https://projet.supabase.co';
const KID = 'cle-es256';

const { privateKey, publicKey } = generateKeyPairSync('ec', {
  namedCurve: 'P-256',
});
const jwk = { ...publicKey.export({ format: 'jwk' }), kid: KID, alg: 'ES256' };

const userId = randomUUID();
const claims = { sub: userId, role: AuthRole.AUTHENTICATED };

const config = {
  get: (key: string) =>
    ({ SUPABASE_JWT_SECRET: SECRET, SUPABASE_URL }[key] as string),
} as unknown as ConfigurationService;

describe('ConvertJwtToAuthUserService', () => {
  let service: ConvertJwtToAuthUserService;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn(
      async () => new Response(JSON.stringify({ keys: [jwk] }), { status: 200 })
    );
    vi.stubGlobal('fetch', fetchMock);
    service = new ConvertJwtToAuthUserService(
      // Même enregistrement que `UsersModule` : le secret y est global.
      new JwtService({ secret: SECRET }),
      config,
      new SupabaseSigningKeysService(config)
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('accepte un jeton signé par le secret HS256 historique', async () => {
    const jwt = sign(claims, SECRET, { algorithm: 'HS256' });

    await expect(service.convertJwtToAuthUser(jwt)).resolves.toMatchObject({
      id: userId,
      role: AuthRole.AUTHENTICATED,
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('accepte un jeton ES256 signé par une clé publiée dans le JWKS', async () => {
    const jwt = sign(claims, privateKey, { algorithm: 'ES256', keyid: KID });

    await expect(service.convertJwtToAuthUser(jwt)).resolves.toMatchObject({
      id: userId,
    });
    expect(fetchMock).toHaveBeenCalledWith(
      `${SUPABASE_URL}/auth/v1/.well-known/jwks.json`,
      expect.anything()
    );
  });

  it('ne relit pas le JWKS à chaque jeton', async () => {
    const jwt = sign(claims, privateKey, { algorithm: 'ES256', keyid: KID });

    await service.convertJwtToAuthUser(jwt);
    await service.convertJwtToAuthUser(jwt);

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('refuse un jeton ES256 signé par une autre clé portant le même kid', async () => {
    const other = generateKeyPairSync('ec', { namedCurve: 'P-256' });
    const jwt = sign(claims, other.privateKey, {
      algorithm: 'ES256',
      keyid: KID,
    });

    await expect(service.convertJwtToAuthUser(jwt)).rejects.toThrow(
      UnauthorizedException
    );
  });

  it("refuse un jeton dont le kid n'est pas publié", async () => {
    const jwt = sign(claims, privateKey, {
      algorithm: 'ES256',
      keyid: 'inconnue',
    });

    await expect(service.convertJwtToAuthUser(jwt)).rejects.toThrow(
      UnauthorizedException
    );
  });

  it('refuse un jeton non signé', async () => {
    const jwt = sign(claims, '', { algorithm: 'none' });

    await expect(service.convertJwtToAuthUser(jwt)).rejects.toThrow(
      UnauthorizedException
    );
  });

  it('refuse un jeton HS256 signé avec la clé publique comme secret', async () => {
    const pem = publicKey.export({ type: 'spki', format: 'pem' }).toString();
    const jwt = sign(claims, Buffer.from(pem), {
      algorithm: 'HS256',
      keyid: KID,
      allowInsecureKeySizes: true,
    });

    await expect(service.convertJwtToAuthUser(jwt)).rejects.toThrow(
      UnauthorizedException
    );
  });

  it('refuse un jeton asymétrique quand le JWKS est injoignable', async () => {
    fetchMock.mockRejectedValue(new Error('réseau'));
    const jwt = sign(claims, privateKey, { algorithm: 'ES256', keyid: KID });

    await expect(service.convertJwtToAuthUser(jwt)).rejects.toThrow(
      UnauthorizedException
    );
  });
});
