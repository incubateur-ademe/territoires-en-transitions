'use client';

import { ENV } from '@/api/environmentVariables';
import { datadogLogs } from '@datadog/browser-logs';

const initDD = () => {
  datadogLogs.init({
    clientToken: ENV.datadog_client_token as string,
    env: ENV.application_env,
    site: 'datadoghq.eu',
    forwardConsoleLogs: ['error', 'info'],
    sessionSampleRate: 100,
    service: 'app',
  });
};
if (ENV.datadog_client_token) {
  console.log('Init DataDog');
  initDD();
} else {
  console.log('No DataDog client token found');
}

export default function DataDogInit() {
  // Render nothing - this component is only included so that the init code
  // above will run client-side
  return null;
}
