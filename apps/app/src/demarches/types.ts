import type { PersonneTagOrUser } from '@tet/domain/collectivites';
import type { DemarcheType } from '@tet/domain/demarches';
import type {
  DemarchePcaetObligation as DomainObligation,
  DemarchePcaetStatus,
  DemarchePcaetTransitionEvaluations,
} from '@tet/domain/demarches';

// Alias en français des types du header, portés par @tet/domain/demarches.
export type DemarchePcaetStatut = DemarchePcaetStatus;
export type DemarchePcaetObligation = DomainObligation;

export type DemarchePcaetTopicStatut = 'complete' | 'incomplete';

/**
 * Ce que `DemarcheCompletionBadge` sait annoncer. `optional` : le volet n'exige
 * aucune saisie, il n'est donc ni en retard ni achevé — l'annoncer « Complété »
 * ferait croire à un travail fait.
 */
export type DemarcheCompletionStatut = DemarchePcaetTopicStatut | 'optional';

export type DemarchePcaet = {
  id: number;
  collectiviteId: number;
  /** Type de démarche : porte les libellés affichés par les vues partagées. */
  type: DemarcheType;
  titre: string;
  description: string;
  /**
   * Statut du dossier dans son cycle de vie (workflow) : la mise à disposition
   * du public en est une étape.
   */
  statut: DemarchePcaetStatut;
  obligation: DemarchePcaetObligation;
  dateCreation: string;
  dateModification: string;
  dateLancement: string | null;
  datePublication: string | null;
  /** Dernière transmission pour avis (null = jamais transmise). */
  dateTransmission: string | null;
  /** Échéance de remise des avis, figée à la transmission. */
  dateEcheanceAvis: string | null;
  pilotes: PersonneTagOrUser[];
  planActionId: number | null;
  /**
   * État de chaque transition pour l'utilisateur courant, calculé côté serveur.
   * Le front ne recompose aucune règle : il lit `enabled` et `blockedBy`.
   */
  transitions: DemarchePcaetTransitionEvaluations;
  /** Ce que le dossier accepte encore comme écriture, tranché côté serveur. */
  amontModifiable: boolean;
  avalModifiable: boolean;
};

/**
 * Patch accepté par `useDemarchePcaet().update`. Les statuts ne se modifient pas
 * par patch — ils passent tous par les transitions du workflow.
 */
export type DemarchePcaetUpdatePatch = Partial<
  Pick<
    DemarchePcaet,
    | 'titre'
    | 'description'
    | 'obligation'
    | 'dateLancement'
    | 'planActionId'
    | 'pilotes'
  >
>;
