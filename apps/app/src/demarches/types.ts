import type { RowOrder } from '@/app/indicateurs/valeurs/grid/indicateur-grid-shape';
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

export type DemarchePcaetTopicId =
  | 'sequestration'
  | 'enr'
  | 'profil_energie_climat'
  | 'polluants_atmospheriques'
  | 'vulnerabilite_territoire';

export type DemarchePcaetTopicStatut = 'complete' | 'incomplete';

export type DemarchePcaetVulnerabiliteNiveau =
  | 'non_renseigne'
  | 'non_concerne'
  | 'faible'
  | 'moyen'
  | 'fort';

export type DemarchePcaetVulnerabiliteDomaineId =
  | 'agriculture'
  | 'amenagement'
  | 'batiments'
  | 'biodiversite'
  | 'eau'
  | 'foret'
  | 'energie'
  | 'economie'
  | 'sante'
  // Permet des domaines personnalisés
  | (string & {});

export type DemarchePcaetVulnerabiliteLigne = {
  domaineId: DemarchePcaetVulnerabiliteDomaineId;
  /** Libellé personnalisé (pour les domaines non prédéfinis). */
  label?: string;
  diagMaintenant: DemarchePcaetVulnerabiliteNiveau;
  diag2050: DemarchePcaetVulnerabiliteNiveau;
  diag2100: DemarchePcaetVulnerabiliteNiveau;
  description2050: string;
  description2100: string;
};

export type DemarchePcaetVulnerabiliteState = {
  lignes: DemarchePcaetVulnerabiliteLigne[];
};

export type PcaetTopicGridState = {
  referenceYear: number | null;
  rowOrder: RowOrder;
  extraYears: number[];
};

export type PcaetTopicGridStateUpdate = (
  previous: PcaetTopicGridState
) => Partial<PcaetTopicGridState>;

/**
 * Parties de la démarche non persistées côté API : elles vivent dans un
 * brouillon sessionStorage, fusionné au header serveur. Les documents, eux, sont
 * persistés — cf. `use-demarche-pcaet-documents`.
 */
export type DemarchePcaetDraftState = {
  topics: Record<DemarchePcaetTopicId, DemarchePcaetTopicStatut>;
  vulnerabilite: DemarchePcaetVulnerabiliteState;
  vulnerabiliteValideeLe: string | null;
  gridStates: Partial<Record<DemarchePcaetTopicId, PcaetTopicGridState>>;
};

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
} & DemarchePcaetDraftState;

/**
 * Patch accepté par `useDemarchePcaet().update` : les champs du header partent
 * vers l'API, les champs du draft vers le sessionStorage. Les statuts ne se
 * modifient plus par patch — ils passent par le workflow (publish/unpublish,
 * transitions).
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
    | 'topics'
    | 'vulnerabilite'
    | 'vulnerabiliteValideeLe'
    | 'gridStates'
  >
>;
