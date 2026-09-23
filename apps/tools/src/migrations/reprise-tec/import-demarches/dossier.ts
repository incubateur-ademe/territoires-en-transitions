/** Le dossier : décide ce qu'une ligne T&C devient dans `demarche` (statut, dates, obligation). */

import { CollectiviteNatureType } from '@tet/domain/collectivites';
import {
  computeAvisDeadline,
  DemarchePcaetObligation,
  DemarchePcaetObligationEnum,
  DemarchePcaetStatusEnum,
  getObligationAssujettissement,
} from '@tet/domain/demarches';
import { format, parseISO, subMonths } from 'date-fns';
import type { Porteur } from './collectivites';
import type { LigneDemarche } from './perimetre';
import type { LigneSuivi, SuiviAdeme } from './suivi-ademe';

const { EN_ELABORATION, INSTRUIT, PUBLIE } = DemarchePcaetStatusEnum;
const { OBLIGATOIRE, VOLONTAIRE } = DemarchePcaetObligationEnum;

type Statut = typeof EN_ELABORATION | typeof INSTRUIT | typeof PUBLIE;

export type Dossier = {
  tecId: number;
  misAJourLe: string | null;
  /** Les dates saisies avant l'an 2000, lues 20AA ou ignorées, pour le rapport. */
  datesRevues: string[];
  colonnes: {
    collectiviteId: number | null;
    titre: string;
    description: string;
    status: Statut;
    obligation: DemarchePcaetObligation;
    launchedAt: string | null;
    publishedAt: string | null;
    transmittedAt: string | null;
    avisDeadlineAt: string | null;
    adoptedAt: string | null;
    createdAt: string | null;
  };
};

/** La ligne de `demarche` à écrire pour une ligne de T&C. */
export const buildDossier = (
  ligneSource: LigneDemarche,
  porteur: Porteur | undefined,
  suivi: SuiviAdeme
): Dossier => {
  const { ligne, datesRevues } = correctDatesSaisies(ligneSource);
  const ligneSuivi = suivi.getLigne(porteur?.siren);
  const approbation = ligneSuivi?.approbation ?? null;
  const statut = calculateStatut(ligne, approbation);
  const dates = calculateDates(ligne, statut, approbation);

  return {
    tecId: ligne.id,
    misAJourLe: ligne.misAJourLe,
    datesRevues,
    colonnes: {
      collectiviteId: porteur?.collectiviteId ?? null,
      titre: ligne.nom,
      description: ligne.description,
      status: statut,
      obligation: calculateObligation(ligne.oblige, ligneSuivi, porteur),
      launchedAt: ligne.lanceLe,
      publishedAt: dates.publishedAt,
      transmittedAt: dates.transmittedAt,
      avisDeadlineAt: dates.avisDeadlineAt,
      adoptedAt: dates.adoptedAt,
      createdAt: ligne.creeLe,
    },
  };
};

/** Les dates saisies à la main dans T&C, que `correctDatesSaisies` vérifie. */
const DATES_SAISIES = [
  'lanceLe',
  'envoiDreal',
  'envoiCr',
  'receptionProjet',
] as const;

/**
 * Règle : une date saisie avant 2000 est une faute de frappe, une année de 10
 * à 99 est lue 20AA (« 0023 » pour 2023), les autres sont ignorées.
 */
const correctDatesSaisies = (ligne: LigneDemarche) => {
  const corrigee = { ...ligne };
  const datesRevues: string[] = [];
  for (const colonne of DATES_SAISIES) {
    const date = ligne[colonne];
    if (date === null || date >= '2000') {
      continue;
    }
    const annee = Number(date.slice(0, 4));
    if (annee >= 10 && annee <= 99) {
      corrigee[colonne] = `20${date.slice(2)}`;
      datesRevues.push(
        `${colonne} ${jour(date)} lue ${jour(corrigee[colonne])}`
      );
    } else {
      corrigee[colonne] = null;
      datesRevues.push(`${colonne} ${jour(date)} ignorée`);
    }
  }
  return { ligne: corrigee, datesRevues };
};

/**
 * Garde, appelée par `gardes.ts` : liste les cas bloquants, un par ligne.
 * - A3 : fenêtre d'avis encore ouverte à la date de référence, échéance comprise ;
 * - D3 : instruit sans date de transmission, le dossier serait enfermé.
 */
export const listCasBloquantsDossiers = (
  dossiers: readonly Dossier[],
  dateReference: string
) => [
  ...dossiers
    .filter(
      (d) =>
        d.colonnes.avisDeadlineAt !== null &&
        d.colonnes.avisDeadlineAt >= dateReference
    )
    .map(
      (d) =>
        `  fenêtre d'avis encore ouverte (A3) : ${decrireDossier(
          d
        )}, échéance ${d.colonnes.avisDeadlineAt}`
    ),
  ...dossiers
    .filter(
      (d) => d.colonnes.status === INSTRUIT && d.colonnes.transmittedAt === null
    )
    .map(
      (d) => `  instruit sans date de transmission (D3) : ${decrireDossier(d)}`
    ),
];

export const decrireDossier = (d: Dossier) =>
  `dossier ${d.tecId} « ${d.colonnes.titre} »`;

/**
 * Règle : élaboration reste en élaboration ; mis en œuvre et sans état sont
 * publiés ; un dépôt pour avis est publié si le suivi l'approuve, instruit sinon.
 */
const calculateStatut = (
  ligne: LigneDemarche,
  approbation: string | null
): Statut => {
  if (ligne.etat === null || ligne.etat === 'mise_en_oeuvre') {
    return PUBLIE;
  }
  if (ligne.etat === 'en_cours_elaboration') {
    return EN_ELABORATION;
  }
  if (ligne.etat === 'depot_pour_avis') {
    if (approbation === null) {
      return INSTRUIT;
    }
    const reference = calculateTransmission(ligne) ?? jour(ligne.creeLe);
    if (reference === null) {
      return PUBLIE;
    }
    /** Deux ans avant la transmission : une approbation plus ancienne est celle du PCAET précédent. */
    const limiteApprobation = format(
      subMonths(parseISO(reference), 24),
      'yyyy-MM-dd'
    );
    return approbation >= limiteApprobation ? PUBLIE : INSTRUIT;
  }
  throw new Error(`État T&C inconnu : « ${ligne.etat} » (ligne ${ligne.id}).`);
};

/**
 * Règle : les quatre dates (transmission, avis, publication, adoption). Pas de transmission en élaboration, sinon la
 * clôture de nuit passerait le dossier en instruit.
 */
const calculateDates = (
  ligne: LigneDemarche,
  statut: Statut,
  approbation: string | null
) => {
  const transmittedAt =
    statut === EN_ELABORATION ? null : calculateTransmission(ligne);
  const avisDeadlineAt =
    transmittedAt &&
    computeAvisDeadline(new Date(transmittedAt)).toISOString().slice(0, 10);

  if (statut !== PUBLIE) {
    return {
      transmittedAt,
      avisDeadlineAt,
      publishedAt: null,
      adoptedAt: null,
    };
  }

  const publishedAt = calculatePublishedAt(ligne, approbation);
  const adoptedAt = calculateAdoptedAt(ligne, approbation, publishedAt);
  return { transmittedAt, avisDeadlineAt, publishedAt, adoptedAt };
};

/** La plus tardive des deux saisines, sinon la réception du projet. */
const calculateTransmission = (ligne: LigneDemarche) => {
  const envois = [jour(ligne.envoiDreal), jour(ligne.envoiCr)].filter(
    (d): d is string => d !== null
  );
  if (envois.length > 0) {
    return envois.reduce((a, b) => (a > b ? a : b));
  }
  return jour(ligne.receptionProjet);
};

/** Le dépôt définitif, l'approbation du suivi, ou la dernière mise à jour. */
const calculatePublishedAt = (
  ligne: LigneDemarche,
  approbation: string | null
) => {
  if (ligne.etat === 'mise_en_oeuvre') {
    return ligne.deposeLe;
  }
  if (ligne.etat === 'depot_pour_avis') {
    return approbation;
  }
  const creation = jour(ligne.creeLe);
  if (approbation !== null && creation !== null && approbation > creation) {
    return approbation;
  }
  return ligne.misAJourLe ?? ligne.creeLe;
};

/** L'approbation du suivi si elle ne suit pas le dépôt définitif, sinon la publication. */
const calculateAdoptedAt = (
  ligne: LigneDemarche,
  approbation: string | null,
  publishedAt: string | null
) => {
  const depot = jour(ligne.deposeLe);
  if (
    ligne.etat === 'mise_en_oeuvre' &&
    approbation !== null &&
    depot !== null &&
    approbation <= depot
  ) {
    return approbation;
  }
  return jour(publishedAt);
};

/**
 * Règle : la déclaration du dossier, sinon le suivi ADEME, sinon le seuil de
 * population du domaine. Une valeur inconnue dans le suivi arrête le script.
 */
const calculateObligation = (
  oblige: boolean | null,
  suivi: LigneSuivi | undefined,
  porteur: Pick<Porteur, 'siren' | 'natureInsee' | 'population'> | undefined
): DemarchePcaetObligation => {
  if (oblige !== null) {
    return oblige ? OBLIGATOIRE : VOLONTAIRE;
  }

  const valeur = suivi?.obligation.trim() ?? '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(valeur) || valeur.toLowerCase() === 'obligé') {
    return OBLIGATOIRE;
  }
  if (
    ['volontaire', 'non-obligé', 'désengagement'].includes(valeur.toLowerCase())
  ) {
    return VOLONTAIRE;
  }
  if (valeur !== '') {
    throw new Error(
      `Obligation inconnue dans le suivi ADEME : « ${valeur} » (SIREN ${porteur?.siren}).`
    );
  }

  const assujettissement = getObligationAssujettissement({
    natureInsee: (porteur?.natureInsee ??
      null) as CollectiviteNatureType | null,
    population: porteur?.population ?? null,
  });
  return assujettissement ?? VOLONTAIRE;
};

/** « 2021-03-15 09:12:00+00 » vers « 2021-03-15 ». */
const jour = (horodatage: string | null) =>
  horodatage === null ? null : horodatage.slice(0, 10);
