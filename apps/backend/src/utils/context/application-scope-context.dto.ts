import { ApplicationDomainsType } from '@tet/domain/utils';

export interface ApplicationScopeContext {
  domain?: ApplicationDomainsType;
  collectiviteId?: number;
  referentielId?: string;
}
