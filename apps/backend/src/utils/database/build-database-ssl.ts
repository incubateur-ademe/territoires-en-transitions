import type { ConnectionOptions as TlsConnectionOptions } from 'node:tls';
import { parsePemCertificate } from '../config/parse-pem-certificate';

// Paramètres d'URL que pg fait primer sur l'objet `ssl` (il fusionne la
// configuration avec `Object.assign({}, config, parse(connectionString))`), ou
// qui changeraient l'hôte réellement joint.
const CONFLICTING_URL_PARAMS = [
  'ssl',
  'sslmode',
  'sslrootcert',
  'sslcert',
  'sslkey',
  'uselibpqcompat',
  'host',
];

/**
 * Options TLS du pool Postgres, quand une CA est fournie.
 *
 * Sans CA, rien n'est imposé : le `sslmode` de l'URL décide (local, CI,
 * Supabase Cloud). Avec une CA (RDB Scaleway, certificat auto-signé), le
 * certificat du serveur est vérifié contre elle, nom d'hôte compris : la RDB
 * porte son IP privée en nom alternatif.
 *
 * Partagée par le backend et apps/tools, qui lisent les mêmes variables.
 */
export function buildDatabaseSsl({
  url,
  ca,
}: {
  url: string;
  ca: string | undefined;
}): TlsConnectionOptions | undefined {
  if (ca === undefined) {
    return undefined;
  }

  const { pem } = parsePemCertificate(ca, 'SUPABASE_DATABASE_SSL_ROOT_CERT');

  // L'erreur native de `new URL` contient l'URL complète, mot de passe compris :
  // on la remplace pour ne pas l'exposer dans les logs de démarrage.
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error(
      "SUPABASE_DATABASE_URL n'est pas une URL valide (caractères spéciaux du mot de passe à percent-encoder ?)"
    );
  }

  const conflicting = CONFLICTING_URL_PARAMS.filter((param) =>
    parsed.searchParams.has(param)
  );
  if (conflicting.length > 0) {
    throw new Error(
      `SUPABASE_DATABASE_URL ne doit pas porter ${conflicting.join(
        ', '
      )} quand SUPABASE_DATABASE_SSL_ROOT_CERT est fourni : pg les ferait primer sur la CA`
    );
  }

  return {
    ca: pem,
    // pg ne transmet pas à TLS un hôte qui est une IP : sans `host`, le
    // certificat serait vérifié contre « localhost ». Une IPv6 garde ses
    // crochets dans `hostname`.
    host: parsed.hostname.replace(/^\[(.*)\]$/, '$1'),
  };
}
