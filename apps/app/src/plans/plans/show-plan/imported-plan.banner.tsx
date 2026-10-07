'use client';

import { appLabels } from '@/app/labels/catalog';
import {
  IMPORT_PLAN_DEMO_URL,
  IMPORT_PLAN_SUPPORT_URL,
} from '@/app/plans/plans/import-plan/import-plan-support.links';
import { Alert, Badge, Button, InlineLink } from '@tet/ui';
import { useState } from 'react';
import { VerifyImportedPlanModal } from './verify-imported-plan.modal';

/** Plan importé par IA en attente de la validation d'un humain. */
export const ImportedPlanBanner = ({ planId }: { planId: number }) => {
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);

  return (
    <div data-test="plans.imported-plan-banner">
      <Alert
        state="warning"
        title={
          <div className="flex flex-wrap items-center gap-2">
            {appLabels.planImporteBanniereTitre}
            <Badge
              title={appLabels.planImporteBanniereAVerifier}
              variant="warning"
              size="sm"
            />
          </div>
        }
        description={
          <p className="mb-0 text-sm font-medium text-grey-9">
            {appLabels.planImporteBanniereDescription}{' '}
            {appLabels.planImporteBanniereDemoAvant}{' '}
            <InlineLink href={IMPORT_PLAN_DEMO_URL} openInNewTab>
              {appLabels.planImporteBanniereDemoLien}
            </InlineLink>{' '}
            {appLabels.planImporteBanniereSupportAvant}{' '}
            <InlineLink href={IMPORT_PLAN_SUPPORT_URL} openInNewTab>
              {appLabels.planImporteBanniereSupportLien}
            </InlineLink>{' '}
            {appLabels.planImporteBanniereSupportApres}
          </p>
        }
        action={
          <Button
            size="sm"
            variant="outlined"
            onClick={() => setIsVerifyModalOpen(true)}
            dataTest="plans.imported-plan-banner.valider"
          >
            {appLabels.planImporteValider}
          </Button>
        }
      />
      <VerifyImportedPlanModal
        planId={planId}
        openState={{
          isOpen: isVerifyModalOpen,
          setIsOpen: setIsVerifyModalOpen,
        }}
      />
    </div>
  );
};
