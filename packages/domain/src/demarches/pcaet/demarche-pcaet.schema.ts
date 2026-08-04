import type { DemarcheTypeEnum } from '../demarche-type.enum.schema';
import type { DemarcheBase } from '../demarche.schema';
import type { DemarchePcaetObligation } from './demarche-pcaet-obligation.enum.schema';
import type { DemarchePcaetPublicationStatus } from './demarche-pcaet-publication-status.enum.schema';
import type { DemarchePcaetStatus } from './demarche-pcaet-status.enum.schema';
import type { DemarchePcaetTransition } from './demarche-pcaet.workflow';

/** Titre par défaut d'une nouvelle démarche (terme métier, partagé front/back). */
export const DEMARCHE_PCAET_DEFAULT_TITRE = 'PCAET réglementaire';

/**
 * Démarche de type PCAET (dossier réglementaire de dépôt) : étend le socle
 * commun `DemarcheBase` avec son discriminant, son cycle de vie et ses champs
 * propres.
 */
export type DemarchePcaet = DemarcheBase & {
  type: typeof DemarcheTypeEnum.PCAET;
  status: DemarchePcaetStatus;
  publicationStatus: DemarchePcaetPublicationStatus;
  obligation: DemarchePcaetObligation;
  /** Date de lancement de la démarche saisie par la collectivité (ISO 8601). */
  launchedAt: string | null;
  publishedAt: string | null;
  /** Dernière transmission pour avis (conservée si l'élaboration est reprise). */
  transmittedAt: string | null;
  /** Échéance de remise des avis, figée à la transmission. */
  avisDeadlineAt: string | null;
  /** Plan d'action (axe racine) rattaché à la démarche. */
  planActionId: number | null;
  /**
   * Transitions applicables par l'utilisateur courant, calculées côté
   * serveur (structure du workflow + guards) — le front les affiche, sans
   * recalculer.
   */
  availableTransitions: DemarchePcaetTransition[];
};
