'use client';
import { ENV } from '@tet/api/environmentVariables';
import { InlineLink } from '@tet/ui';
import { Crisp } from 'crisp-sdk-web';
import { ReactNode } from 'react';

/** Ouvre le chat Crisp intégré à l'app, ou sa page web si le widget n'est pas chargé. */
export const OpenCrispChatLink = ({
  children,
  dataTest,
}: {
  children: ReactNode;
  dataTest?: string;
}) => (
  <InlineLink
    href={`https://go.crisp.chat/chat/embed/?website_id=${ENV.crisp_website_id}`}
    target="_blank"
    rel="noreferrer noopener"
    data-test={dataTest}
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
