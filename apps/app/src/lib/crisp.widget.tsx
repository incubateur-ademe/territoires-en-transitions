'use client';

import { ENV } from '@/api/environmentVariables';
import { Crisp } from 'crisp-sdk-web';
import { useEffect } from 'react';

export default function CrispChat() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (ENV.crisp_website_id && ENV.crisp_website_id.length > 0) {
      Crisp.configure(ENV.crisp_website_id);
    }
  });

  return null;
}
