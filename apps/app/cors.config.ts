import { isAllowedOrigin } from '@tet/api';
import { ENV } from '@tet/api/environmentVariables';

const ACCESS_CONTROL_ALLOW_METHODS = 'GET,DELETE,PATCH,POST,PUT,OPTIONS';
const ACCESS_CONTROL_ALLOW_HEADERS =
  'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, apikey, authorization';

/**
 * Ajoute les en-têtes CORS sur la réponse.
 *
 * Pose `Access-Control-Allow-Origin` uniquement si l'origine de la requête est
 * autorisée, puis les autres en-têtes CORS sur toutes les réponses (fidèle à
 * l'ancien middleware de apps/auth).
 */
export function applyCorsHeaders(
  responseHeaders: Headers,
  requestOrigin: string | null
): void {
  if (
    requestOrigin &&
    isAllowedOrigin(
      requestOrigin,
      ENV.application_env === 'ci' ? 'ci' : process.env.NODE_ENV,
      process.env.ALLOWED_ORIGIN_PATTERN
    )
  ) {
    responseHeaders.append('Access-Control-Allow-Origin', requestOrigin);
  }

  responseHeaders.append('Access-Control-Allow-Credentials', 'true');
  responseHeaders.append(
    'Access-Control-Allow-Methods',
    ACCESS_CONTROL_ALLOW_METHODS
  );
  responseHeaders.append(
    'Access-Control-Allow-Headers',
    ACCESS_CONTROL_ALLOW_HEADERS
  );
}
