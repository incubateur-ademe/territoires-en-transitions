/**
 * Voir doc/adr/0003-conventions-de-code.md
 */

import { createEnumObject } from './enum.utils';

export const ApplicationDomains = [
  'utilisateurs',
  'collectivites',
  'indicateurs',
  'plans',
  'referentiels',
] as const;

export const ApplicationDomainsEnum = createEnumObject(ApplicationDomains);

export type ApplicationDomainsType =
  (typeof ApplicationDomainsEnum)[keyof typeof ApplicationDomainsEnum];

export const ApplicationSousScopes = [
  'utilisateurs',
  'collectivites',
  'indicateurs',
  'plans',
  'fiches',
  'paniers',
  'referentiels',
  'scores',
] as const;

export const ApplicationSousScopesEnum = createEnumObject(
  ApplicationSousScopes
);

export type ApplicationSousScopesType =
  (typeof ApplicationSousScopesEnum)[keyof typeof ApplicationSousScopesEnum];
