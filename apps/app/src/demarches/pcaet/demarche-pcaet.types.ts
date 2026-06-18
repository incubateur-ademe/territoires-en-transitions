import type { PersonneTagOrUser } from '@tet/domain/collectivites';
import type { PcaetDocumentsState } from './pcaet-documents.constants';

export type DemarchePcaetStatut =
  | 'brouillon'
  | 'en_elaboration'
  | 'pret_pour_depot'
  | 'soumis_ademe'
  | 'en_verification'
  | 'valide'
  | 'publie';

export type DemarchePcaetStatutPublication = 'brouillon' | 'publie';

export type DemarchePcaetObligation = 'volontaire' | 'obligatoire';

export type DemarchePcaetVoletId =
  | 'sequestration'
  | 'enr'
  | 'profil_energie_climat'
  | 'polluants_atmospheriques'
  | 'vulnerabilite_territoire';

export type DemarchePcaetVoletStatut = 'complete' | 'incomplete';

export type DemarchePcaetVulnerabiliteNiveau =
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

export type DemarchePcaet = {
  id: string;
  collectiviteId: number;
  titre: string;
  description: string;
  /** Statut de publication visible dans l’interface (brouillon / publié). */
  statutPublication: DemarchePcaetStatutPublication;
  /** Statut d’avancement du dossier (workflow ADEME, à terme). */
  statut: DemarchePcaetStatut;
  obligation: DemarchePcaetObligation;
  dateCreation: string;
  dateModification: string;
  dateLancement: string | null;
  datePublication: string | null;
  pilotes: PersonneTagOrUser[];
  planActionId: number | null;
  volets: Record<DemarchePcaetVoletId, DemarchePcaetVoletStatut>;
  documents: PcaetDocumentsState;
  vulnerabilite: DemarchePcaetVulnerabiliteState;
  /** Date ISO de la dernière validation de la saisie de vulnérabilité. */
  vulnerabiliteValideeLe: string | null;
};
