'use client';

import { makeCollectivitePriorisationUrl } from '@/app/app/paths';
import { appLabels } from '@/app/labels/catalog';
import { LoadingStatus } from '@/app/ui/shared/loading-status';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { Breadcrumbs, PageHeader } from '@tet/ui';
import { JSX } from 'react';
import { usePreselection } from '../use-preselection';
import { PreselectionContent } from './preselection.content';

export const PreselectionView = (): JSX.Element => {
  const { collectiviteId } = useCurrentCollectivite();
  const preselection = usePreselection();

  return (
    <>
      <PageHeader>
        <PageHeader.Title>
          {appLabels.actionsPreselectionneesTitre}
        </PageHeader.Title>
        <PageHeader.Subtitle>
          <Breadcrumbs
            size="sm"
            items={[
              {
                label: appLabels.priorisationLeviersTitre,
                href: makeCollectivitePriorisationUrl({ collectiviteId }),
              },
              { label: appLabels.actionsPreselectionneesTitre },
            ]}
          />
        </PageHeader.Subtitle>
      </PageHeader>
      {preselection.isReady ? (
        <PreselectionContent preselection={preselection} />
      ) : (
        <LoadingStatus />
      )}
    </>
  );
};
