'use client';
import { appLabels } from '@/app/labels/catalog';
import { OpenCrispChatLink } from '@/app/lib/open-crisp-chat.link';
import { InlineLink } from '@tet/ui';

/** Import accompagné : la collectivité envoie son document à l'équipe, qui réalise l'import. */
export const RequestPlanImportInfo = () => (
  <>
    <p>
      {appLabels.importPlanSupportEnvoyez}{' '}
      <OpenCrispChatLink>{appLabels.importPlanSupportChat}</OpenCrispChatLink>{' '}
      {appLabels.importPlanSupportOuAdresse}{' '}
      <InlineLink href={`mailto:${appLabels.importPlanSupportEmail}`}>
        {appLabels.importPlanSupportEmail}
      </InlineLink>
      {'.'}
    </p>
    <p className="font-bold mb-0">{appLabels.importPlanSupportPriseEnCharge}</p>
  </>
);
