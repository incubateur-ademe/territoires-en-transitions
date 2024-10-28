'use client';

import { Crisp } from 'crisp-sdk-web';
import { ENV } from 'environmentVariables';
import { useEffect } from 'react';

export default function CrispChat() {
  useEffect(() => {
    if (ENV.crisp_website_id && ENV.crisp_website_id.length > 0) {
      Crisp.configure(ENV.crisp_website_id);
    }
  });

  return null;
}
