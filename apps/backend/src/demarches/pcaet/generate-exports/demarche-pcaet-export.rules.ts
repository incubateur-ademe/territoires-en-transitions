import { unaccent } from '@tet/backend/utils/unaccent.utils';
import {
  DemarchePcaetTransitionEnum,
  getDateCivileFrance,
  type PcaetDiagnostic,
} from '@tet/domain/demarches';
import type {
  DemarchePcaetExportTransition,
  DemarchePcaetExportType,
} from '../shared/models/demarche-pcaet-export.table';

/**
 * Les deux variantes du plan portent le même libellé : un lecteur ne reçoit
 * jamais que l'une des deux.
 */
const TYPE_LABELS: Record<DemarchePcaetExportType, string> = {
  plan: 'Plan',
  plan_expurge: 'Plan',
  indicateurs: 'Indicateurs',
};

const TRANSITION_LABELS: Record<DemarchePcaetExportTransition, string> = {
  [DemarchePcaetTransitionEnum.TRANSMETTRE_POUR_AVIS]: 'transmis-pour-avis',
  [DemarchePcaetTransitionEnum.PUBLIER]: 'publie',
};

/** Caractères refusés dans un nom de fichier par au moins un système. */
const FORBIDDEN_FILENAME_CHARS = /[\\/:*?"<>|]/g;

/**
 * Nom proposé au téléchargement d'un classeur :
 * `PCAET_<collectivité>_<Plan|Indicateurs>_<transmis-pour-avis|publie>_<AAAA-MM-JJ>.xlsx`.
 * Sans transition, c'est un export du jour : le nom ne porte que la date.
 */
export const buildDemarchePcaetExportFilename = ({
  collectiviteNom,
  type,
  transition,
  date,
}: {
  collectiviteNom: string;
  type: DemarchePcaetExportType;
  transition?: DemarchePcaetExportTransition;
  date: Date;
}): string =>
  unaccent(
    [
      'PCAET',
      collectiviteNom.trim(),
      TYPE_LABELS[type],
      ...(transition ? [TRANSITION_LABELS[transition]] : []),
      getDateCivileFrance(date),
    ].join('_')
  ).replace(FORBIDDEN_FILENAME_CHARS, '-') + '.xlsx';

/**
 * Le diagnostic a-t-il de quoi remplir un classeur ? Au moins une valeur
 * d'indicateur ou une ligne de vulnérabilité renseignée. Chaque thématique a
 * sa ligne, même vierge : la présence d'une ligne ne dit rien.
 */
export const hasPcaetDiagnosticData = (diagnostic: PcaetDiagnostic): boolean =>
  diagnostic.indicateurValeurs.some(
    ({ indicateurValeur }) =>
      indicateurValeur.resultat !== null || indicateurValeur.objectif !== null
  ) ||
  diagnostic.vulnerabilite.lignes.some(
    (ligne) =>
      ligne.niveauMaintenant !== null ||
      ligne.niveau2050 !== null ||
      ligne.niveau2100 !== null ||
      Boolean(ligne.objectifs2050?.trim()) ||
      Boolean(ligne.objectifs2100?.trim())
  );
