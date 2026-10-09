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

/**
 * Qui a décidé l'obligation, dans l'ordre de la règle :
 * - `declaration` : le dossier T&C le dit lui-même ;
 * - `suivi` : le suivi ADEME le dit ;
 * - `seuil` : absent du suivi, le seuil de population du domaine tranche ;
 * - `defaut` : rien de tout ça, volontaire.
 */
type SourceObligation = 'declaration' | 'suivi' | 'seuil' | 'defaut';

/**
 * D'où vient la date d'adoption d'un dossier publié :
 * - `suivi` : la date d'approbation du suivi ADEME ;
 * - `repli` : faute de mieux, la date de publication.
 */
type SourceAdoption = 'suivi' | 'repli';

export type Dossier = {
  tecId: number;
  misAJourLe: string | null;
  /** L'approbation du suivi ADEME de la collectivité, que lit `calculateElaborations`. */
  approbationSuivi: string | null;
  /** Les dates saisies avant l'an 2000, lues 20AA ou ignorées, pour le rapport. */
  datesRevues: string[];
  /** La transmission que l'avis de l'État du suivi contredit, ramenée ou gardée, pour le rapport. */
  transmissionRevue: string | null;
  sources: {
    obligation: SourceObligation;
    adoption: SourceAdoption | null;
  };
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
  const transmission = calculateTransmission(
    ligne,
    ligneSuivi?.avisEtat ?? null
  );
  const statut = calculateStatut(ligne, transmission.date, approbation);
  const dates = calculateDates(ligne, statut, transmission.date, approbation);
  const obligation = calculateObligation(ligne.oblige, ligneSuivi, porteur);

  return {
    tecId: ligne.id,
    misAJourLe: ligne.misAJourLe,
    approbationSuivi: approbation,
    datesRevues,
    transmissionRevue: statut === EN_ELABORATION ? null : transmission.revue,
    sources: {
      obligation: obligation.source,
      adoption: dates.sourceAdoption,
    },
    colonnes: {
      collectiviteId: porteur?.collectiviteId ?? null,
      titre: ligne.nom,
      description: ligne.description,
      status: statut,
      obligation: obligation.valeur,
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
export const correctDateSaisie = (date: string | null) => {
  if (date === null || date >= '2000') {
    return date;
  }
  const annee = Number(date.slice(0, 4));
  return annee >= 10 && annee <= 99 ? `20${date.slice(2)}` : null;
};

const correctDatesSaisies = (ligne: LigneDemarche) => {
  const corrigee = { ...ligne };
  const datesRevues: string[] = [];
  for (const colonne of DATES_SAISIES) {
    const date = ligne[colonne];
    const lue = correctDateSaisie(date);
    if (lue === date) {
      continue;
    }
    corrigee[colonne] = lue;
    datesRevues.push(
      lue === null
        ? `${colonne} ${jour(date)} ignorée`
        : `${colonne} ${jour(date)} lue ${jour(lue)}`
    );
  }
  return { ligne: corrigee, datesRevues };
};

/**
 * Garde, appelée par `gardes.ts` : liste les cas bloquants, un par ligne.
 * - A3 : fenêtre d'avis encore ouverte à la date de référence, échéance comprise ;
 * - D7 : publié sans date de publication ;
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
      (d) => d.colonnes.status === PUBLIE && d.colonnes.publishedAt === null
    )
    .map(
      (d) => `  publié sans date de publication (D7) : ${decrireDossier(d)}`
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
  transmission: string | null,
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
    const reference = transmission ?? jour(ligne.creeLe);
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
  transmission: string | null,
  approbation: string | null
) => {
  const transmittedAt = statut === EN_ELABORATION ? null : transmission;
  const avisDeadlineAt =
    transmittedAt &&
    computeAvisDeadline(new Date(transmittedAt)).toISOString().slice(0, 10);

  if (statut !== PUBLIE) {
    return {
      transmittedAt,
      avisDeadlineAt,
      publishedAt: null,
      adoptedAt: null,
      sourceAdoption: null,
    };
  }

  const publication = calculatePublishedAt(ligne, approbation);
  const adoption = calculateAdoptedAt(ligne, approbation, publication);
  return {
    transmittedAt,
    avisDeadlineAt,
    publishedAt: publication.date,
    adoptedAt: adoption.date,
    sourceAdoption: adoption.source,
  };
};

/**
 * La date de transmission pour avis, contrôlée par l'avis de l'État du suivi
 * ADEME : un avis ne précède pas la transmission.
 * - l'avis du suivi est à moins d'un an avant la date de T&C : la transmission
 *   est ramenée à la plus précoce des dates de T&C qui ne le suit pas, à défaut
 *   au jour de l'avis ;
 * - il est à plus d'un an : la date de T&C est gardée, le suivi parle d'une
 *   collectivité et peut dater l'avis de son PCAET précédent.
 * `revue` décrit le cas pour le rapport, `null` si le suivi ne contredit rien.
 */
const calculateTransmission = (
  ligne: LigneDemarche,
  avisEtat: string | null
): { date: string | null; revue: string | null } => {
  const date = calculateTransmissionTec(ligne);
  if (date === null || avisEtat === null || avisEtat >= date) {
    return { date, revue: null };
  }
  const unAnAvant = format(subMonths(parseISO(date), 12), 'yyyy-MM-dd');
  if (avisEtat < unAnAvant) {
    return {
      date,
      revue: `transmission ${date} gardée, avis de l'État du suivi le ${avisEtat}, plus d'un an avant`,
    };
  }
  const compatibles = [
    jour(ligne.receptionProjet),
    jour(ligne.envoiDreal),
    jour(ligne.envoiCr),
  ].filter((d): d is string => d !== null && d <= avisEtat);
  const ramenee = compatibles.length > 0 ? plusPrecoce(compatibles) : avisEtat;
  return {
    date: ramenee,
    revue: `transmission ${date} ramenée au ${ramenee}, avis de l'État du suivi le ${avisEtat}`,
  };
};

/**
 * La réception du projet, sinon la plus précoce des deux dates « envoi avis ».
 * Malgré leur nom, ces deux dates sont celles des avis rendus, pas de l'envoi du dossier.
 */
const calculateTransmissionTec = (ligne: LigneDemarche) => {
  const reception = jour(ligne.receptionProjet);
  if (reception !== null) {
    return reception;
  }
  const avis = [jour(ligne.envoiDreal), jour(ligne.envoiCr)].filter(
    (d): d is string => d !== null
  );
  return avis.length > 0 ? plusPrecoce(avis) : null;
};

const plusPrecoce = (dates: readonly string[]) =>
  dates.reduce((a, b) => (a < b ? a : b));

/** Le dépôt définitif, l'approbation du suivi, ou la dernière mise à jour ; avec sa source. */
const calculatePublishedAt = (
  ligne: LigneDemarche,
  approbation: string | null
): { date: string | null; source: SourceAdoption } => {
  if (ligne.etat === 'mise_en_oeuvre') {
    return { date: ligne.deposeLe, source: 'repli' };
  }
  if (ligne.etat === 'depot_pour_avis') {
    return { date: approbation, source: 'suivi' };
  }
  const creation = jour(ligne.creeLe);
  if (approbation !== null && creation !== null && approbation > creation) {
    return { date: approbation, source: 'suivi' };
  }
  return { date: ligne.misAJourLe ?? ligne.creeLe, source: 'repli' };
};

/** L'approbation du suivi si elle ne suit pas le dépôt définitif, sinon la publication ; avec sa source. */
const calculateAdoptedAt = (
  ligne: LigneDemarche,
  approbation: string | null,
  publication: { date: string | null; source: SourceAdoption }
): { date: string | null; source: SourceAdoption } => {
  const depot = jour(ligne.deposeLe);
  if (
    ligne.etat === 'mise_en_oeuvre' &&
    approbation !== null &&
    depot !== null &&
    approbation <= depot
  ) {
    return { date: approbation, source: 'suivi' };
  }
  return { date: jour(publication.date), source: publication.source };
};

/**
 * Règle : la déclaration du dossier, sinon le suivi ADEME, sinon le seuil de
 * population du domaine. Une valeur inconnue dans le suivi arrête le script.
 */
const calculateObligation = (
  oblige: boolean | null,
  suivi: LigneSuivi | undefined,
  porteur: Pick<Porteur, 'siren' | 'natureInsee' | 'population'> | undefined
): { valeur: DemarchePcaetObligation; source: SourceObligation } => {
  if (oblige !== null) {
    return { valeur: oblige ? OBLIGATOIRE : VOLONTAIRE, source: 'declaration' };
  }

  const valeur = suivi?.obligation.trim() ?? '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(valeur) || valeur.toLowerCase() === 'obligé') {
    return { valeur: OBLIGATOIRE, source: 'suivi' };
  }
  if (
    ['volontaire', 'non-obligé', 'désengagement'].includes(valeur.toLowerCase())
  ) {
    return { valeur: VOLONTAIRE, source: 'suivi' };
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
  return assujettissement === null
    ? { valeur: VOLONTAIRE, source: 'defaut' }
    : { valeur: assujettissement, source: 'seuil' };
};

/** « 2021-03-15 09:12:00+00 » vers « 2021-03-15 ». */
const jour = (horodatage: string | null) =>
  horodatage === null ? null : horodatage.slice(0, 10);
