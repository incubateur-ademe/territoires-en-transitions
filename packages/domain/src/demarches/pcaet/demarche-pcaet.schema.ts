import type { DemarcheTypeEnum } from '../demarche-type.enum.schema';
import type { DemarcheBase } from '../demarche.schema';
import type { DemarchePcaetObligation } from './demarche-pcaet-obligation.enum.schema';
import type { DemarchePcaetStatus } from './demarche-pcaet-status.enum.schema';
import type { DemarchePcaetTransitionEvaluations } from './workflow/demarche-pcaet-workflow.facade';

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
  obligation: DemarchePcaetObligation;
  /** Date de lancement de la démarche saisie par la collectivité (ISO 8601). */
  launchedAt: string | null;
  /** Mise à disposition du public (nulle si la démarche n'a jamais été publiée). */
  publishedAt: string | null;
  /** Dernière transmission pour avis (conservée si l'élaboration est reprise). */
  transmittedAt: string | null;
  /** Échéance de remise des avis, figée à la transmission. */
  avisDeadlineAt: string | null;
  /** Plan d'action (axe racine) rattaché à la démarche. */
  planActionId: number | null;
  /**
   * État de chaque transition pour l'utilisateur courant, calculé côté serveur
   * (structure du workflow + guards) — le front l'affiche, sans recalculer :
   * `enabled` arme l'action, `blockedBy` dit pourquoi elle ne l'est pas.
   */
  transitions: DemarchePcaetTransitionEvaluations;
  /**
   * Ce que le dossier accepte encore comme écriture, calculé côté serveur : le
   * front s'en sert pour passer le reste en lecture seule, au lieu de dériver la
   * règle du statut.
   */
  amontModifiable: boolean;
  avalModifiable: boolean;
};
