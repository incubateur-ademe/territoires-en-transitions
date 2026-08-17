import {
  DemarchePcaetStatusEnum,
  type DemarchePcaetStatus,
} from '../demarche-pcaet-status.enum.schema';
import { isDemarchePcaetAmontModifiable } from '../demarche-pcaet-modifiable.rules';

/**
 * Cycle de vie d'un dépôt PCAET :
 *
 * 1. `en_elaboration` — la collectivité constitue son dossier (documents
 *    réglementaires, diagnostic par topic, programme d'actions).
 * 2. `transmis_pour_avis` — le dossier est transmis aux instances
 *    consultatives : préfet de région, conseil régional et MRAe (avis rendus
 *    via les services déconcentrés — DREAL/DDT — sur la plateforme).
 * 3. `adopte` — la délibération d'adoption est déposée : PCAET en vigueur,
 *    piloté pendant 6 ans (bilan à mi-parcours puis évaluation finale).
 * 4. `publie` — le dossier est mis à disposition du public.
 * 5. `archive` — l'évaluation finale est déposée, le cycle est clos ; un
 *    nouveau dépôt (renouvellement) peut démarrer dès l'adoption.
 */
export const DEMARCHE_PCAET_INITIAL_STATUS =
  DemarchePcaetStatusEnum.EN_ELABORATION;

/**
 * Étapes du parcours affiché : `publie` est le même stade réglementaire
 * qu'`adopte` (le PCAET est en vigueur), la publication ne fait qu'ouvrir sa
 * consultation par le public.
 */
export const DEMARCHE_PCAET_ETAPES = [
  'elaboration',
  'transmis',
  'adopte',
  'archive',
] as const;

export type DemarchePcaetEtape = (typeof DEMARCHE_PCAET_ETAPES)[number];

const DEMARCHE_PCAET_STATUS_ETAPES = {
  [DemarchePcaetStatusEnum.EN_ELABORATION]: 'elaboration',
  [DemarchePcaetStatusEnum.TRANSMIS_POUR_AVIS]: 'transmis',
  [DemarchePcaetStatusEnum.ADOPTE]: 'adopte',
  [DemarchePcaetStatusEnum.PUBLIE]: 'adopte',
  [DemarchePcaetStatusEnum.ARCHIVE]: 'archive',
} as const satisfies Record<DemarchePcaetStatus, DemarchePcaetEtape>;

export const getEtapeDemarchePcaet = (
  status: DemarchePcaetStatus
): DemarchePcaetEtape => DEMARCHE_PCAET_STATUS_ETAPES[status];

/** Rang de l'étape, pour ordonner l'affichage du parcours. */
export const getEtapeIndexDemarchePcaet = (
  status: DemarchePcaetStatus
): number => DEMARCHE_PCAET_ETAPES.indexOf(getEtapeDemarchePcaet(status));

/**
 * Le dossier est-il consultable par le public ? Une démarche archivée l'a été
 * publiée et le reste.
 */
export const isPublieDemarchePcaetStatus = (
  status: DemarchePcaetStatus
): boolean =>
  status === DemarchePcaetStatusEnum.PUBLIE ||
  status === DemarchePcaetStatusEnum.ARCHIVE;

/**
 * Statuts d'une démarche « en cours » : une collectivité ne peut pas démarrer
 * un nouveau dépôt tant qu'une démarche est dans l'un de ces statuts.
 *
 * Décrit un **état**, pas un droit : ce qui est permis se lit dans les
 * capacités du workflow.
 */
export const DEMARCHE_PCAET_ACTIVE_STATUSES = [
  DemarchePcaetStatusEnum.EN_ELABORATION,
  DemarchePcaetStatusEnum.TRANSMIS_POUR_AVIS,
] as const satisfies readonly DemarchePcaetStatus[];

export const isActiveDemarchePcaetStatus = (
  status: DemarchePcaetStatus
): boolean =>
  (DEMARCHE_PCAET_ACTIVE_STATUSES as readonly DemarchePcaetStatus[]).includes(
    status
  );

/**
 * Un dossier transmis, même repris en élaboration, reste engagé dans le circuit
 * d'avis (demandes, instruction).
 */
export const isDemarchePcaetJamaisTransmis = (demarche: {
  transmittedAt: string | null;
}): boolean => demarche.transmittedAt === null;

/**
 * Suppression : uniquement une démarche en élaboration **jamais transmise**.
 * Elle mêle le statut et l'historique du dossier, ce qu'une règle de
 * modifiabilité ne saurait pas dire seule — d'où ce prédicat explicite.
 */
export const canDeleteDemarchePcaet = (demarche: {
  status: DemarchePcaetStatus;
  transmittedAt: string | null;
}): boolean =>
  isDemarchePcaetAmontModifiable(demarche.status) &&
  isDemarchePcaetJamaisTransmis(demarche);
