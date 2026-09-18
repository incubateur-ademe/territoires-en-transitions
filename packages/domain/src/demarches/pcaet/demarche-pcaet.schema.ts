import type { DemarcheTypeEnum } from '../demarche-type.enum.schema';
import type { DemarcheBase } from '../demarche.schema';
import type { DemarchePcaetObligation } from './demarche-pcaet-obligation.enum.schema';
import type { DemarchePcaetStatus } from './demarche-pcaet-status.enum.schema';
import type { DemarchePcaetTransitionEvaluations } from './workflow/demarche-pcaet-workflow.facade';

/** Titre par défaut d'une nouvelle démarche (terme métier, partagé front/back). */
export const DEMARCHE_PCAET_DEFAULT_TITRE = 'PCAET réglementaire';

/**
 * Titre proposé à la création : le terme métier suivi de l'année du dépôt.
 *
 * L'année est celle du **lancement saisi**, et non celle du jour : une
 * collectivité qui régularise un dépôt de 2018 nomme son dossier « 2018 ». Elle
 * se lit sur la date civile (AAAA-MM-JJ) plutôt que par `new Date(…)` —
 * `new Date('2018-01-01')` vaut minuit UTC, donc le 31/12/2017 à l'ouest de
 * Greenwich, et le titre y perdrait une année.
 */
export const buildDemarchePcaetTitre = (dateLancement?: string | null) => {
  const annee = dateLancement?.slice(0, 4);
  return annee && /^\d{4}$/.test(annee)
    ? `${DEMARCHE_PCAET_DEFAULT_TITRE} ${annee}`
    : DEMARCHE_PCAET_DEFAULT_TITRE;
};

/**
 * Durée de validité d'un PCAET adopté : elle court à partir de la date
 * d'adoption, d'où la saisie de cette date à la validation du dépôt final.
 */
export const DEMARCHE_PCAET_VALIDITE_ANS = 6;

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
  /**
   * Date de la délibération d'adoption (AAAA-MM-JJ), saisie à la validation du
   * dépôt final : c'est elle qui fait courir la validité du PCAET.
   */
  adoptedAt: string | null;
  /** Dernière transmission pour avis (conservée si l'élaboration est reprise). */
  transmittedAt: string | null;
  /**
   * Le PCAET a été transmis pour avis hors de la plateforme : la démarche a
   * démarré à l'étape de finalisation, sans circuit d'avis.
   *
   * Figé à la création. Se double du statut plutôt que de s'y substituer : le
   * statut oublie d'où vient le dossier une fois publié, ce drapeau non — et
   * c'est lui qui tient les écrans d'instruction à l'écart ensuite.
   */
  transmittedOffPlatform: boolean;
  /** Échéance de remise des avis, figée à la transmission. */
  avisDeadlineAt: string | null;
  /**
   * Plans d'action (axes racines) rattachés à la démarche, dans l'ordre de
   * rattachement. Vide tant qu'aucun programme d'actions n'est renseigné.
   */
  planActionIds: number[];
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
