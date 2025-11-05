import { ApplicationDomainsType } from '@/domain/utils';

export interface ApplicationScopeContext {
  domain?: ApplicationDomainsType;
  collectiviteId?: number;
  referentielId?: string;
}
