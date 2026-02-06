import { AuthRole } from '../../users/models/auth.models';
import { ApplicationScopeContext } from './application-scope-context.dto';

export interface ApplicationContext {
  source: string;

  service: string;

  version: string;

  environment: string;

  /**
   * Name of the logger
   */
  logger?: ApplicationContextLogger;

  scope: ApplicationScopeContext;

  correlationId?: string;

  requestPath?: string;

  authRole?: AuthRole;

  userId?: string;

  /**
   *api key client id used to generate the JWT token
   */
  apiClientId?: string;

  // When authenticating with a service account
  serviceAccountId?: string;

  // Error stack
  error?: ApplicationContextError;
}

export interface ApplicationContextLogger {
  name: string;
}

export interface ApplicationContextError {
  stack?: string;
  message: string;
}
