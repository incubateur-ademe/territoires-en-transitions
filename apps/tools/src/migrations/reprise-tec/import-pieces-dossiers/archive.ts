/** L'archive des fichiers de T&C (son dossier `Uploads/`) : l'empreinte et le format de chaque fichier, lus sur ses octets. */

import { calculateDocumentHash } from '@tet/backend/collectivites/documents/store-document/calculate-document-hash.utils';
import type { DocumentHash } from '@tet/domain/collectivites';
import { readFile, stat } from 'fs/promises';
import { join } from 'path';
import type { Fichier } from './fichiers';

export type Contenu = {
  empreinte: DocumentHash;
  taille: number;
  estPdf: boolean;
};

const LECTURES_EN_PARALLELE = 8;

const toChemin = (archive: string, f: Pick<Fichier, 'chemin'>) =>
  join(archive, f.chemin.replace(/^Uploads\//, ''));

/** Lit chaque fichier de l'archive : son empreinte, sa taille, et s'il est un PDF. Un fichier absent n'a pas de contenu. */
export const readContenus = async (
  archive: string,
  fichiers: readonly Pick<Fichier, 'tecId' | 'chemin'>[]
) => {
  const contenus = new Map<number, Contenu>();
  const aLire = [...fichiers];
  const lire = async () => {
    for (let f = aLire.shift(); f; f = aLire.shift()) {
      const octets = await readOctets(archive, f).catch(() => undefined);
      if (octets) {
        contenus.set(f.tecId, {
          empreinte: calculateDocumentHash(octets),
          taille: octets.length,
          estPdf: octets.subarray(0, 4).toString('latin1') === '%PDF',
        });
      }
    }
  };
  await Promise.all(Array.from({ length: LECTURES_EN_PARALLELE }, lire));
  return contenus;
};

/** Les octets d'un fichier de l'archive. */
export const readOctets = (archive: string, f: Pick<Fichier, 'chemin'>) =>
  readFile(toChemin(archive, f));

/** Garde, appelée par `gardes.ts` : l'archive n'est pas un dossier `Uploads/` (sans `Demarches/`). */
export const listCasBloquantsArchive = async (archive: string) => {
  const demarches = await stat(join(archive, 'Demarches')).catch(
    () => undefined
  );
  return demarches?.isDirectory()
    ? []
    : [`  archive introuvable : pas de dossier Demarches/ dans ${archive}`];
};
