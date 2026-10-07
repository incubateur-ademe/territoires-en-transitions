import * as z from 'zod/mini';

/**
 * Niveau de vulnérabilité d'un territoire pour une thématique, à un horizon donné.
 * Il n'y a pas de valeur « non renseigné » : l'absence de saisie est un `null`,
 * tandis que `non_concerne` est un choix explicite de la collectivité — et la
 * seule façon de sortir une thématique du socle de ce qui lui est exigé.
 */
export const DemarchePcaetVulnerabiliteNiveauEnum = {
  NON_CONCERNE: 'non_concerne',
  FAIBLE: 'faible',
  MOYEN: 'moyen',
  FORT: 'fort',
} as const;

export const demarchePcaetVulnerabiliteNiveauValues = [
  DemarchePcaetVulnerabiliteNiveauEnum.NON_CONCERNE,
  DemarchePcaetVulnerabiliteNiveauEnum.FAIBLE,
  DemarchePcaetVulnerabiliteNiveauEnum.MOYEN,
  DemarchePcaetVulnerabiliteNiveauEnum.FORT,
] as const;

export const demarchePcaetVulnerabiliteNiveauSchema = z.enum(
  demarchePcaetVulnerabiliteNiveauValues
);

export type DemarchePcaetVulnerabiliteNiveau = z.infer<
  typeof demarchePcaetVulnerabiliteNiveauSchema
>;

/**
 * Horizons de la table de vulnérabilité, du constat à la projection la plus
 * lointaine. L'ordre est celui des colonnes du tableau.
 */
export const DemarchePcaetVulnerabiliteHorizonEnum = {
  MAINTENANT: 'maintenant',
  H2050: '2050',
  H2100: '2100',
} as const;

export const demarchePcaetVulnerabiliteHorizonValues = [
  DemarchePcaetVulnerabiliteHorizonEnum.MAINTENANT,
  DemarchePcaetVulnerabiliteHorizonEnum.H2050,
  DemarchePcaetVulnerabiliteHorizonEnum.H2100,
] as const;

export const demarchePcaetVulnerabiliteHorizonSchema = z.enum(
  demarchePcaetVulnerabiliteHorizonValues
);

export type DemarchePcaetVulnerabiliteHorizon = z.infer<
  typeof demarchePcaetVulnerabiliteHorizonSchema
>;
