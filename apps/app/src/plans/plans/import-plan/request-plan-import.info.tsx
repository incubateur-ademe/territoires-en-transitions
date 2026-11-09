'use client';
import { appLabels } from '@/app/labels/catalog';
import { InlineLink } from '@tet/ui';
import { SupportChatLink } from './support-chat.link';

/** Import accompagné : la collectivité envoie son document à l'équipe, qui réalise l'import. */
export const RequestPlanImportInfo = () => (
  <>
    <p>
      {appLabels.importPlanSupportEnvoyez}{' '}
      <SupportChatLink>{appLabels.importPlanSupportChat}</SupportChatLink>{' '}
      {appLabels.importPlanSupportOuAdresse}{' '}
      <InlineLink href={`mailto:${appLabels.importPlanSupportEmail}`}>
        {appLabels.importPlanSupportEmail}
      </InlineLink>
      {'.'}
    </p>
    <p className="font-bold mb-0">{appLabels.importPlanSupportPriseEnCharge}</p>
  </>
);
