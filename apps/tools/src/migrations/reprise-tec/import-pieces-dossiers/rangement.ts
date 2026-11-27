/** Le rangement des pièces dans le catalogue du dossier : une case par mot-clé du nom, le PCAET global, sinon les documents additionnels. */

import {
  isDemarcheDocumentDeEtape,
  listDefaultInclusions,
  type DemarcheDocumentEtape,
} from '@tet/domain/demarches';
import type { Catalogue } from './catalogue';
import type { Piece, Temps } from './pieces';

export type Rangement = {
  piece: Piece;
  etape: DemarcheDocumentEtape;
} & ({ niveau: 1 | 2; documentId: string } | { niveau: 3; raison: string });

export type Inclusion = {
  demarcheId: number;
  collectiviteId: number;
  documentId: string;
  date: string | null;
};

const DOCUMENT_GLOBAL = 'pcaet_document_global';
const DELIBERATION = 'deliberation';

// Dans l'ordre : le premier mot-clé trouvé dans le nom décide.
const MOTS_CLES: readonly [string, RegExp][] = [
  [DELIBERATION, /\bdelib|\bdelc? ?\d/],
  [
    'pcaet_memoire_reponse_avis',
    /\bmemoire\b|\breponses? (aux?|a l) avis|prise en compte|integration (des? )?remarques/,
  ],
  [
    'pcaet_synthese_consultation_publique',
    /consultation (du )?public|participation (du )?public|synthese des (contributions|observations)|bilan (de la )?(consultation|concertation)/,
  ],
  [
    'pcaet_ees',
    /\bees\b|evaluation environnementale|rapport environnemental|declaration environnementale|\bdecl env|\brnt\b|resume non technique|\beie\b|etat initial|etude d impact/,
  ],
  ['pcaet_plan_qualite_air', /\bpaqa\b|qualite de l air|\bplan air\b/],
  ['pcaet_plan_chaleur_froid', /chaleur/],
  ['pcaet_dispositif_suivi_evaluation', /\bsuivi\b|evaluation/],
  [
    'pcaet_plan_actions',
    /plan d? ?actions?\b|programme d? ?actions?|fiches? actions?|\bpa\b/,
  ],
  ['pcaet_strategie_territoriale', /strategi/],
  ['pcaet_diagnostic', /\bdiag/],
  ['pcaet_bilan_pcaet_precedent', /bilan (du )?(pcaet|plan climat)/],
  // un acte sans le mot « délibération » : « Adoption du PCAET », « Arrêt projet PCAET »
  [DELIBERATION, /\badopt|\bapprob|\bapprouv|\barret/],
];

const NOM_GENERIQUE = /\bpcaet\b|plan climat|rapport final|dossier complet/;

const normalize = (nom: string) =>
  nom
    .normalize('NFD')
    .replace(/\p{Mn}/gu, '')
    .toLowerCase()
    .replace(/\.[a-z0-9]{1,4}$/, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

/** Règle : le nom dit quelle délibération ; sinon le dépôt pour avis est l'arrêt, le dépôt définitif l'adoption. */
export const decideDeliberation = (nom: string, temps: Temps) => {
  const n = normalize(nom);
  if (/engagement|prescri|lancement/.test(n)) {
    return 'pcaet_deliberation_engagement';
  }
  if (/\barret/.test(n)) {
    return 'pcaet_deliberation_arret';
  }
  if (/adopt|approb|approuv/.test(n)) {
    return 'pcaet_deliberation_adoption';
  }
  return temps === 'amont'
    ? 'pcaet_deliberation_arret'
    : temps === 'aval'
    ? 'pcaet_deliberation_adoption'
    : undefined;
};

const findCase = (piece: Piece) => {
  const nom = normalize(piece.fichier.nom);
  const documentId = MOTS_CLES.find(([, motif]) => motif.test(nom))?.[0];
  return documentId === DELIBERATION
    ? decideDeliberation(piece.fichier.nom, piece.temps)
    : documentId;
};

/** Range chaque pièce, la première déposée d'abord ; le PCAET global coche les pièces qu'il comprend, comme l'app. */
export const rangePieces = (pieces: readonly Piece[], catalogue: Catalogue) => {
  const prises = new Set<string>();
  const parDepot = new Map<string, number>();
  for (const p of pieces) {
    const depot = `${p.fichier.demarcheId}|${p.temps}`;
    parDepot.set(depot, (parDepot.get(depot) ?? 0) + 1);
  }

  const ranger = (piece: Piece): Rangement => {
    const { demarcheId } = piece.fichier;
    if (piece.temps === 'autre') {
      return { piece, etape: 'amont', niveau: 3, raison: 'autre rubrique' };
    }
    const etape = piece.temps;
    if (!piece.estPdf) {
      return { piece, etape, niveau: 3, raison: 'pas un PDF' };
    }
    const seulDuDepot = parDepot.get(`${demarcheId}|${etape}`) === 1;
    const motCle = findCase(piece);
    const documentId =
      motCle ??
      (seulDuDepot && NOM_GENERIQUE.test(normalize(piece.fichier.nom))
        ? DOCUMENT_GLOBAL
        : undefined);
    if (documentId === undefined) {
      return { piece, etape, niveau: 3, raison: 'sans mot-clé' };
    }
    const definition = catalogue
      .get(demarcheId)
      ?.find((d) => d.id === documentId);
    if (definition === undefined) {
      return {
        piece,
        etape,
        niveau: 3,
        raison: `${documentId} : ne concerne pas la collectivité`,
      };
    }
    if (!isDemarcheDocumentDeEtape(definition.etape, etape)) {
      return {
        piece,
        etape,
        niveau: 3,
        raison: `${documentId} : pas à ce temps du dossier`,
      };
    }
    const cle = `${demarcheId}|${documentId}|${etape}`;
    if (prises.has(cle)) {
      return {
        piece,
        etape,
        niveau: 3,
        raison: `${documentId} : case déjà prise`,
      };
    }
    prises.add(cle);
    return { piece, etape, niveau: motCle ? 1 : 2, documentId };
  };

  const rangements = pieces.map(ranger);
  const inclusions = rangements.flatMap((r): Inclusion[] =>
    r.niveau === 2
      ? listDefaultInclusions(
          catalogue.get(r.piece.fichier.demarcheId) ?? [],
          DOCUMENT_GLOBAL
        ).map((documentId) => ({
          demarcheId: r.piece.fichier.demarcheId,
          collectiviteId: r.piece.fichier.collectiviteId,
          documentId,
          date: r.piece.date,
        }))
      : []
  );
  return { rangements, inclusions };
};
