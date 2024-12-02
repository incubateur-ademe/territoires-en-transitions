import ApplicationDomains from '../application-domains.enum';

/**
 *
 */
export interface ApplicationScopeContext {
  domain?: ApplicationDomains;

  collectiviteId?: number;

  referentielId?: string;
}
