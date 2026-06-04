import { ActionId, Etoile, RoleKey } from '@tet/domain/referentiels';

export type ScoreMinimumViewModel = {
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

export type RolePilotesPresence = Record<RoleKey, boolean>;

export type Parcours = {
  maximumRequestableStar: Etoile;
  completude: { done: boolean };
  scoreMinimum: ScoreMinimumViewModel | null;
  scoreFait: number;
  mesures: MesureViewModel[];
  roleMesures: RoleMesures;
  acteEngagement: { signed: boolean; demandeId: number | null };
  peutModifierDocumentsCandidature: boolean;
};
