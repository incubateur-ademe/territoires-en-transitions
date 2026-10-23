import { describe, expect, it } from 'vitest';
import { buildDatabaseSsl } from './build-database-ssl';

// Certificat auto-signé de test, à l'image de celui d'une RDB Scaleway : nom
// alternatif sur l'IP privée.
const RDB_CERT = `-----BEGIN CERTIFICATE-----
MIIBsjCCAVigAwIBAgIUXokGGNCs5IyhpgzN6qga3mlsEBYwCgYIKoZIzj0EAwIw
JTEUMBIGA1UECgwLU2NhbGV3YXlSREIxDTALBgNVBAMMBHRlc3QwIBcNMjYxMDIz
MTQyMjQxWhgPMjEyNjA5MjkxNDIyNDFaMCUxFDASBgNVBAoMC1NjYWxld2F5UkRC
MQ0wCwYDVQQDDAR0ZXN0MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEw+UoqeA/
u9oViR6EOQP35CqQIU64fvN/LmPmUJG8R8TrXh4IoGh4CIRzt7dSKd4nlrr2bogl
XxxFb5GJM/u5JKNkMGIwHQYDVR0OBBYEFAmiGhT678HlBp+GF6Kwov2u0V1gMB8G
A1UdIwQYMBaAFAmiGhT678HlBp+GF6Kwov2u0V1gMA8GA1UdEwEB/wQFMAMBAf8w
DwYDVR0RBAgwBocECgABAjAKBggqhkjOPQQDAgNIADBFAiEAtUaGHGzLzbAerMe8
9Pqyi7hryhRUNxkFlimjcJ1Qc6YCIA3czQTa7LJP/iwNmgMeaOi3T7y1CcrzzsdD
KfVvGt7b
-----END CERTIFICATE-----`;

const URL_WITHOUT_SSLMODE = 'postgres://tet_admin:s3cr3t@10.0.1.2:5432/tet';

describe('buildDatabaseSsl', () => {
  it("ne configure rien sans CA : le sslmode de l'URL décide", () => {
    expect(
      buildDatabaseSsl({
        url: 'postgres://u:p@localhost:54322/postgres?sslmode=require',
        ca: undefined,
      })
    ).toBeUndefined();
  });

  it("vérifie le certificat contre la CA et l'hôte de l'URL", () => {
    expect(
      buildDatabaseSsl({ url: URL_WITHOUT_SSLMODE, ca: RDB_CERT })
    ).toEqual({ ca: RDB_CERT, host: '10.0.1.2' });
  });

  it('accepte une CA injectée sur une ligne avec des \\n littéraux', () => {
    expect(
      buildDatabaseSsl({
        url: URL_WITHOUT_SSLMODE,
        ca: RDB_CERT.replace(/\n/g, '\\n'),
      })?.ca
    ).toBe(RDB_CERT);
  });

  it("retire les crochets d'une IPv6", () => {
    expect(
      buildDatabaseSsl({
        url: 'postgres://u:p@[fd00::1]:5432/tet',
        ca: RDB_CERT,
      })?.host
    ).toBe('fd00::1');
  });

  it('refuse au démarrage une CA vide plutôt que de se connecter en clair', () => {
    expect(() =>
      buildDatabaseSsl({ url: URL_WITHOUT_SSLMODE, ca: '' })
    ).toThrow(
      /SUPABASE_DATABASE_SSL_ROOT_CERT n'est pas un certificat PEM valide/
    );
  });

  it('refuse au démarrage une URL dont un paramètre primerait sur la CA', () => {
    expect(() =>
      buildDatabaseSsl({
        url: `${URL_WITHOUT_SSLMODE}?sslmode=no-verify`,
        ca: RDB_CERT,
      })
    ).toThrow(/ne doit pas porter sslmode/);
  });

  it("n'expose pas le mot de passe quand l'URL est invalide", () => {
    expect(() =>
      buildDatabaseSsl({ url: 'postgres://u:s3cr3t@@ho st/tet', ca: RDB_CERT })
    ).toThrow(
      expect.objectContaining({
        message: expect.not.stringContaining('s3cr3t'),
      })
    );
  });
});
