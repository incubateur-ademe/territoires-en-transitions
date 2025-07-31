'use client';

import { ENV } from '@/api/environmentVariables';
import { Crisp } from 'crisp-sdk-web';
import { useEffect } from 'react';
import { setCrispSegments } from '../../app/(authed)/app-providers';

export default function CrispChat() {
  useEffect(() => {
    if (ENV.crisp_website_id && ENV.crisp_website_id.length > 0) {
      Crisp.configure(ENV.crisp_website_id);

      setCrispSegments();
    }
  });

  return null;
}
