'use client';

import { ENV } from '@tet/api/environmentVariables';
import { InlineLink } from '@tet/ui';
import { Crisp } from 'crisp-sdk-web';
import { ReactNode } from 'react';

/** Lien vers le support en ligne : ouvre le chat intégré au site. */
export const SupportChatLink = ({ children }: { children: ReactNode }) => (
  <InlineLink
    href={`https://go.crisp.chat/chat/embed/?website_id=${ENV.crisp_website_id}`}
    target="_blank"
    rel="noreferrer noopener"
    onClick={(event) => {
      // Le lien ne sert que si le widget n'est pas chargé (pas d'ID Crisp,
      // bloqueur de pub). `$crisp.is` n'existe qu'une fois le script Crisp
      // réellement exécuté.
      const crispRuntime = (window as { $crisp?: { is?: unknown } }).$crisp;
      if (Crisp.isCrispInjected() && crispRuntime?.is) {
        event.preventDefault();
        Crisp.chat.open();
      }
    }}
  >
    {children}
  </InlineLink>
);
