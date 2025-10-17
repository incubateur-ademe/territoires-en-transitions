'use client';

import { ENV } from '@/api/environmentVariables';
import { useEffect } from 'react';

export default function CrispChat() {
  useEffect(() => {
    const loadCrispLazily = async () => {
      if (typeof window === 'undefined') {
        return;
      }

      const alreadyLoaded = '$crisp' in window;
      if (alreadyLoaded) {
        return;
      }

      if (!ENV.crisp_website_id || ENV.crisp_website_id.length === 0) {
        return;
      }

      const { Crisp } = await import('crisp-sdk-web');
      Crisp.configure(ENV.crisp_website_id);
    };

    loadCrispLazily();
  }, []);

  return null;
}
