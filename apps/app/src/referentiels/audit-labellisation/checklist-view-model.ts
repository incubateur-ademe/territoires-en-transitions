import { ActionId, Etoile, RoleKey } from '@tet/domain/referentiels';

export type MinimumScoreViewModel = {
  done: boolean;
  seuilPercent: number;
};

export type MesureViewModel = {
  actionId: ActionId;
  identifiant: string;
  formulation: string;
  done: boolean;
  minRealisePercentage: number;
  minProgrammePercentage: number | null;
};

export type RoleMesureViewModel = {
  actionId: ActionId;
  done: boolean;
};

export type RoleMesures = Record<RoleKey, RoleMesureViewModel | null>;

export type Parcours = {
  etoileObjectif: Etoile;
  completude: { done: boolean };
  minimumScore: MinimumScoreViewModel;
  scoreFait: number;
  mesures: MesureViewModel[];
  roleMesures: RoleMesures;
  acteEngagement: { signed: boolean; demandeId: number | null };
  canModifyCandidatureDocuments: boolean;
};
