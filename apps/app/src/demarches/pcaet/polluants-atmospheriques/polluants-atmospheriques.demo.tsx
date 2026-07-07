'use client';

import { makeCollectiviteDemarchePcaetIndicateursUrl } from '@/app/app/paths';
import { listDemarchesPcaet } from '@/app/demarches/pcaet/demarche-pcaet.storage';
import { DemarcheIndicateursGridView } from '@/app/demarches/pcaet/indicateurs-grid/demarche-indicateurs-grid.view';
import { polluantsGridStructure } from '@/app/demarches/pcaet/indicateurs-grid/grid-structures';
import { appLabels } from '@/app/labels/catalog';
import { useCollectiviteId } from '@tet/api/collectivites';
import { Breadcrumbs, PageHeader } from '@tet/ui';
import { JSX } from 'react';

export const PolluantsAtmospheriquesDemo = (): JSX.Element => {
  const collectiviteId = useCollectiviteId();
  const mostRecentDemarche = listDemarchesPcaet(collectiviteId)[0];

  return (
    <div
      className="flex flex-col gap-4 pb-12"
      data-test="PolluantsAtmospheriquesPage"
    >
      <PageHeader>
        <PageHeader.Title>
          {appLabels.demarchePcaetPolluantsTitre}
        </PageHeader.Title>

        <PageHeader.Subtitle>
          <Breadcrumbs
            items={[
              ...(mostRecentDemarche
                ? [
                    {
                      label: mostRecentDemarche.titre,
                      href: makeCollectiviteDemarchePcaetIndicateursUrl({
                        collectiviteId,
                        demarchePcaetId: mostRecentDemarche.id,
                      }),
                    },
                  ]
                : []),
              { label: appLabels.demarchePcaetPolluantsTitre },
            ]}
          />
        </PageHeader.Subtitle>
      </PageHeader>

      <DemarcheIndicateursGridView structure={polluantsGridStructure} />
    </div>
  );
};
