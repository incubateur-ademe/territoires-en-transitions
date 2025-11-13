import { ENV } from '../environmentVariables';

export function getRequestUrl(request: Request) {
  const url = new URL(request.url);
  const [hostname, port] = request.headers.get('host')?.split(':') || [];

  // Get the hostname of the request, e.g. 'app.territoiresentransitions.fr'
  // We cannot simply use `url.hostname` because it returns '0.0.0.0' in Docker environment
  url.hostname = hostname || url.hostname;
  url.port =
    ENV.node_env !== 'development' &&
    ENV.application_env !== 'ci' &&
    url.hostname !== 'localhost'
      ? '443'
      : port || url.port;

  return url;
}
