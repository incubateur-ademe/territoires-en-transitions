import { AuthRole } from '../../users/models/auth.models';
import { ApplicationScopeContext } from './application-scope-context.dto';

/**
 * See https://docs.datadoghq.com/fr/logs/log_configuration/attributes_naming_convention/#attributs-r%C3%A9serv%C3%A9s
 * See https://app.datadoghq.eu/logs/pipelines/standard-attributes
 */
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
