import { X509Certificate } from 'node:crypto';

/**
 * Lit un certificat PEM passé par variable d'environnement.
 *
 * Une variable déclarée mais vide, ou qui n'est pas un certificat, est une
 * erreur de configuration : on la refuse au démarrage plutôt que de laisser la
 * connexion échouer (ou se faire sans vérification) à la première requête.
 */
export function parsePemCertificate(
  rawPem: string,
  variableName: string
): { pem: string; fingerprint256: string } {
  // Un PEM injecté sur une ligne (secret, variable d'environnement) arrive
  // souvent avec des `\n` littéraux.
  const pem = rawPem.replace(/\\n/g, '\n');
  try {
    return { pem, fingerprint256: new X509Certificate(pem).fingerprint256 };
  } catch {
    throw new Error(`${variableName} n'est pas un certificat PEM valide`);
  }
}
