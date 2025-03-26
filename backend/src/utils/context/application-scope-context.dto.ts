import { ApplicationDomainsType } from '../application-domains.enum';

/**
 *
 */
export interface ApplicationScopeContext {
  domain?: ApplicationDomainsType;

  collectiviteId?: number;

  referentielId?: string;
}
