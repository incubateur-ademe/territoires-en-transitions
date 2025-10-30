import { ENV } from '../environmentVariables';

type DatadogLogs = typeof import('@datadog/browser-logs').datadogLogs;

let datadogLogsSingleton: Promise<DatadogLogs | null> | null = null;

export async function getDatadogLogs(): Promise<DatadogLogs | null> {
  if (datadogLogsSingleton) {
    return datadogLogsSingleton;
  }

  datadogLogsSingleton = (async () => {
    if (typeof window === 'undefined') return null;

    if (!ENV.datadog_client_token || ENV.datadog_client_token.length === 0) {
      return null;
    }

    const { datadogLogs } = await import('@datadog/browser-logs');

    const alreadyLoaded = 'DD_LOGS' in window;

    if (!alreadyLoaded) {
      datadogLogs.init({
        clientToken: ENV.datadog_client_token,
        service: 'app',
        env: ENV.application_env,
        site: 'datadoghq.eu',
        forwardConsoleLogs: ['error', 'info'],
        sessionSampleRate: 100,
        useSecureSessionCookie: true,
      });
    }

    return datadogLogs;
  })();

  return datadogLogsSingleton;
}
