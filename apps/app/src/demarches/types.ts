import type { PersonneTagOrUser } from '@tet/domain/collectivites';
import type { DemarcheType } from '@tet/domain/demarches';
import type {
  DemarchePcaetObligation as DomainObligation,
  DemarchePcaetPublicationStatus,
  DemarchePcaetStatus,
  DemarchePcaetTransition,
} from '@tet/domain/demarches';

// Alias en français des types du header, portés par @tet/domain/demarches.
export type DemarchePcaetStatut = DemarchePcaetStatus;
export type DemarchePcaetStatutPublication = DemarchePcaetPublicationStatus;
export type DemarchePcaetObligation = DomainObligation;

export type DemarchePcaetTopicStatut = 'complete' | 'incomplete';

export type DemarchePcaet = {
  id: number;
  collectiviteId: number;
  /** Type de démarche : porte les libellés affichés par les vues partagées. */
  type: DemarcheType;
  titre: string;
  description: string;
  /** Statut de publication visible dans l’interface (brouillon / publié). */
  statutPublication: DemarchePcaetStatutPublication;
  /** Statut d’avancement du dossier (workflow, cf. @tet/domain/demarches). */
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
  /** Transitions applicables par l'utilisateur courant, calculées côté serveur. */
  availableTransitions: DemarchePcaetTransition[];
};

/**
 * Patch accepté par `useDemarchePcaet().update`. Les statuts ne se modifient pas
 * par patch — ils passent par le workflow (publish/unpublish, transitions).
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
