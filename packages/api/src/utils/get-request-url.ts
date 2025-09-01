import { ENV } from '@/api/environmentVariables';
import { NextRequest } from "next/server";

export function getRequestUrl(request: NextRequest | Request) {
  const url = (request as NextRequest).nextUrl?.clone() || new URL(request.url);

  // Get the hostname of the request, e.g. 'app.territoiresentransitions.fr'
  // We cannot simply use `url.hostname` because it returns '0.0.0.0' in Docker environment
  url.hostname = request.headers.get('host')?.split(':')[0] ?? url.hostname;
  url.port =
    ENV.node_env !== 'development' &&
    ENV.application_env !== 'ci' &&
    url.hostname !== 'localhost'
      ? '443'
      : url.port;

  return url;
}
