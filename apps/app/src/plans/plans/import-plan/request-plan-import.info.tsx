'use client';
import { appLabels } from '@/app/labels/catalog';
import { ENV } from '@tet/api/environmentVariables';
import { InlineLink } from '@tet/ui';
import { Crisp } from 'crisp-sdk-web';

/** Import accompagné : la collectivité envoie son document à l'équipe, qui réalise l'import. */
export const RequestPlanImportInfo = () => (
  <>
    <p>
      {appLabels.importPlanSupportEnvoyez}{' '}
      <InlineLink
        href={`https://go.crisp.chat/chat/embed/?website_id=${ENV.crisp_website_id}`}
        target="_blank"
        rel="noreferrer noopener"
        onClick={(event) => {
          // Ouvre le chat intégré au site ; le lien ne sert que si le widget
          // n'est pas chargé (pas d'ID Crisp, bloqueur de pub). `$crisp.is`
          // n'existe qu'une fois le script Crisp réellement exécuté.
          const crispRuntime = (window as { $crisp?: { is?: unknown } }).$crisp;
          if (Crisp.isCrispInjected() && crispRuntime?.is) {
            event.preventDefault();
            Crisp.chat.open();
          }
        }}
      >
        {appLabels.importPlanSupportChat}
      </InlineLink>{' '}
      {appLabels.importPlanSupportOuAdresse}{' '}
      <InlineLink href={`mailto:${appLabels.importPlanSupportEmail}`}>
        {appLabels.importPlanSupportEmail}
      </InlineLink>
      {'.'}
    </p>
    <p className="font-bold mb-0">{appLabels.importPlanSupportPriseEnCharge}</p>
  </>
);
