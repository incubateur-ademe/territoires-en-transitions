import type { Instrumentation } from 'next';
import { validateRuntimeEnv } from './src/utils/runtime-env/validate-runtime-env';

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    validateRuntimeEnv();
  }
}

// Erreurs du serveur Next (rendu, route handlers, server actions) remontées
// dans l'error tracking PostHog. posthog-node ne tourne pas sur le runtime edge.
export const onRequestError: Instrumentation.onRequestError = async (
  error,
  request,
  context
) => {
  if (process.env.NEXT_RUNTIME !== 'nodejs') {
    return;
  }

  // Le navigateur a fermé la connexion pendant le streaming du rendu (page
  // quittée, prefetch annulé) : React interrompt le rendu, ce n'est pas un bug.
  if (
    error instanceof Error &&
    error.message === 'The destination stream closed early.'
  ) {
    return;
  }

  const { captureServerException, getDistinctIdFromCookie } = await import(
    './src/utils/error-tracking/capture-exception.server'
  );
  const cookie = request.headers.cookie;

  await captureServerException(error, {
    distinctId: getDistinctIdFromCookie(
      Array.isArray(cookie) ? cookie.join('; ') : cookie
    ),
    properties: {
      $request_path: request.path,
      $request_method: request.method,
      route_path: context.routePath,
      route_type: context.routeType,
      router_kind: context.routerKind,
    },
  });
};
