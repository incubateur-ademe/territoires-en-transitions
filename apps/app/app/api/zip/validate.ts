import path from 'node:path';
import { z } from 'zod';

// Helpers de validation pour `POST /api/zip` — extraits dans un module séparé
// pour pouvoir être testés indépendamment du runtime Next.js.
//
// Voir `route.ts` pour le contexte sécurité (pentest V4 / ORHUS-302, SSRF).

export const MAX_FILES = 100;

export const STORAGE_SIGNED_PATH_PREFIX = '/storage/v1/object/sign/';

export const signedUrlEntrySchema = z.object({
  filename: z.string().trim().min(1).max(255),
  url: z.url(),
});

export const zipRequestSchema = z.object({
  signedUrls: z.array(signedUrlEntrySchema).min(1).max(MAX_FILES),
});

export type ZipRequest = z.infer<typeof zipRequestSchema>;

/**
 * Vérifie qu'une URL pointe bien vers le bucket Supabase Storage configuré,
 * et uniquement vers le chemin des URL signées
 * (`/storage/v1/object/sign/...`). Toute autre origine, tout autre chemin
 * (par ex. `/storage/v1/object/<bucket>/...` non signé, ou un autre service
 * Supabase) est rejeté.
 */
export const isAllowedStorageUrl = (
  rawUrl: string,
  supabaseUrl: string | undefined
): boolean => {
  if (!supabaseUrl) {
    return false;
  }
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return false;
  }
  let storageBase: URL;
  try {
    storageBase = new URL(supabaseUrl);
  } catch {
    return false;
  }
  return (
    parsed.protocol === storageBase.protocol &&
    parsed.host === storageBase.host &&
    parsed.pathname.startsWith(STORAGE_SIGNED_PATH_PREFIX)
  );
};

/**
 * Ramène un nom de fichier fourni par le client à un nom basique sans
 * séparateur de chemin, pour empêcher tout « zip slip » lors de l'extraction
 * côté utilisateur.
 */
export const sanitizeFilename = (filename: string): string | null => {
  const base = path.basename(filename.replace(/\\/g, '/').trim());
  if (!base || base === '.' || base === '..' || base.includes('\0')) {
    return null;
  }
  return base;
};
