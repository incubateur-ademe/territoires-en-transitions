/** Les pièces des dossiers : une par dossier, étape et contenu ; les copies d'un même contenu s'y fondent. */

import type { Contenu } from './archive';
import type { Depot } from './bibliotheque';
import type { Fichier } from './fichiers';

export type Temps = 'amont' | 'aval' | 'autre';

export type Piece = {
  fichier: Fichier;
  fichiers: Fichier[];
  temps: Temps;
  contenu: Contenu | undefined;
  estPdf: boolean;
  date: string | null;
};

// Un fichier d'avis qui n'est pas l'avis va au dossier transmis.
const TEMPS_PAR_TYPE: Record<number, Temps> = {
  22: 'amont',
  23: 'amont',
  24: 'aval',
  25: 'aval',
  27: 'amont',
  28: 'amont',
};

// Une autre rubrique va aux documents additionnels de l'amont.
const etapeDe = (temps: Temps) => (temps === 'aval' ? 'aval' : 'amont');

/** Règle : dépôt pour avis à l'amont, daté de la transmission ; dépôt définitif à l'aval, daté de la publication ; le reste, sans date. Un contenu déposé en autre rubrique et au dépôt pour avis garde le dépôt pour avis. */
export const buildPieces = (
  fichiers: readonly Fichier[],
  contenus: ReadonlyMap<number, Contenu>
) => {
  const pieces = new Map<string, Piece>();
  for (const f of fichiers) {
    const temps = TEMPS_PAR_TYPE[f.typeFichierId] ?? 'autre';
    const contenu = contenus.get(f.tecId);
    const cle = `${f.demarcheId}|${etapeDe(temps)}|${
      contenu?.empreinte ?? `manquant ${f.tecId}`
    }`;
    const piece = pieces.get(cle);
    if (piece) {
      piece.fichiers.push(f);
      if (piece.temps === 'autre' && temps === 'amont') {
        Object.assign(piece, { fichier: f, temps, date: f.transmisLe });
      }
      continue;
    }
    pieces.set(cle, {
      fichier: f,
      fichiers: [f],
      temps,
      contenu,
      estPdf: contenu?.estPdf ?? /\.pdf$/i.test(f.nom),
      date:
        temps === 'amont' ? f.transmisLe : temps === 'aval' ? f.publieLe : null,
    });
  }
  return [...pieces.values()];
};

/** Une pièce s'inscrit dans la bibliothèque de la collectivité du dossier. */
export const toDepot = (p: Piece): Depot => ({
  collectiviteId: p.fichier.collectiviteId,
  fichier: p.fichier,
  contenu: p.contenu,
  confidentiel: false,
});
