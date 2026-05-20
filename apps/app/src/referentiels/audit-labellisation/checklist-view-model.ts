import { ActionId, Etoile } from '@tet/domain/referentiels';
import { RoleKey } from './role-mesures';

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

export type Parcours = {
  etoile: Etoile;
  completude: { done: boolean };
  scoreMinimum: ScoreMinimumViewModel | null;
  mesures: MesureViewModel[];
  roleMesures: RoleMesures;
  acteEngagement: { signed: boolean; demandeId: number | null };
};
