import {
  ActionId,
  Etoile,
  ReponseAttendue,
  RoleKey,
} from '@tet/domain/referentiels';

export type MinimumScoreViewModel = {
  done: boolean;
  seuilPercent: number;
};

export type MesureViewModel = {
  actionId: ActionId;
  identifiant: string;
  formulation: string;
  done: boolean;
  reponseAttendue: ReponseAttendue;
};

export type RoleMesureViewModel = {
  actionId: ActionId;
  done: boolean;
};

export type RoleMesures = Record<RoleKey, RoleMesureViewModel | null>;

export type Parcours = {
  etoileObjectif: Etoile;
  completude: { done: boolean };
  minimumScore: MinimumScoreViewModel | null;
  scoreFait: number;
  mesures: MesureViewModel[];
  roleMesures: RoleMesures;
  acteEngagement: { demandeId: number | null };
};
