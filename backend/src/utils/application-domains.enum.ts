/**
 * Voir doc/adr/0003-conventions-de-code.md
 */
export const ApplicationDomains = {
  UTILISATEURS: 'utilisateurs',
  COLLECTIVITES: 'collectivites',
  INDICATEURS: 'indicateurs',
  PLANS: 'plans',
  REFERENTIELS: 'referentiels',
} as const;

export type ApplicationDomainsType =
  (typeof ApplicationDomains)[keyof typeof ApplicationDomains];

export const ApplicationSousScopes = {
  UTILISATEURS: 'utilisateurs',
  COLLECTIVITES: 'collectivites',
  INDICATEURS: 'indicateurs',
  PLANS: 'plans',
  FICHES: 'fiches',
  PANIERS: 'paniers',
  REFERENTIELS: 'referentiels',
  SCORES: 'scores',
} as const;

export type ApplicationSousScopesType =
  (typeof ApplicationSousScopes)[keyof typeof ApplicationSousScopes];
