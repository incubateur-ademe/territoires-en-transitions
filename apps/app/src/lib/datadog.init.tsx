'use client';

import { ENV } from '@/api/environmentVariables';
import { useEffect } from 'react';

export default function DataDogInit() {
  useEffect(() => {
    const loadDataDogLazily = async () => {
      if (typeof window === 'undefined') return;

      const alreadyLoaded = 'DD_LOGS' in window;
      if (alreadyLoaded) {
        return;
      }

      if (!ENV.datadog_client_token || ENV.datadog_client_token.length === 0) {
        return;
      }

      const { datadogLogs } = await import('@datadog/browser-logs');
      datadogLogs.init({
        clientToken: ENV.datadog_client_token,
        service: 'app',
        env: ENV.application_env,
        site: 'datadoghq.eu',
        forwardConsoleLogs: ['error', 'info'],
        sessionSampleRate: 100,
        useSecureSessionCookie: true,
      });
    };

    loadDataDogLazily();
  }, []);

  return null;
}
