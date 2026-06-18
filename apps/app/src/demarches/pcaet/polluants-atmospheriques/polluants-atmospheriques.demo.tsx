'use client';

import { makeCollectiviteDemarchePcaetDetailUrl } from '@/app/app/paths';
import { appLabels } from '@/app/labels/catalog';
import { listDemarchesPcaet } from '@/app/demarches/pcaet/demarche-pcaet.storage';
import { useToastContext } from '@/app/utils/toast/toast-context';
import { useCollectiviteId } from '@tet/api/collectivites';
import { Breadcrumbs, Divider } from '@tet/ui';
import { JSX, useState } from 'react';
import { DraftCell, IndicatorValues } from './grid-model';
import { applyValuesToIndicators } from './indicator-values-source';
import {
  getPolluantsIndicators,
  savePolluantsIndicators,
} from './polluants-atmospheriques.storage';
import { PolluantsAtmospheriquesView } from './polluants-atmospheriques.view';

export const PolluantsAtmospheriquesDemo = (): JSX.Element => {
  const collectiviteId = useCollectiviteId();
  const { setToast } = useToastContext();
  const [referenceYear] = useState(() => new Date().getFullYear());
  const [indicators, setIndicators] = useState<IndicatorValues[]>(() =>
    getPolluantsIndicators({ collectiviteId, referenceYear })
  );

  const mostRecentDemarche = listDemarchesPcaet(collectiviteId)[0];

  const handleSave = (cells: DraftCell[]): Promise<boolean> => {
    const next = applyValuesToIndicators(indicators, cells);
    savePolluantsIndicators({ collectiviteId, indicators: next });
    setIndicators(next);
    setToast('success', appLabels.demarchePcaetPolluantsValeursEnregistreesDemo);
    return Promise.resolve(true);
  };

  return (
    <div
      className="flex flex-col gap-4 pb-12"
      data-test="PolluantsAtmospheriquesPage"
    >
      <div className="w-full">
        <div className="flex items-start justify-between gap-4 mb-3">
          <h1 className="text-primary-9 mb-0">
            {appLabels.demarchePcaetPolluantsTitre}
          </h1>
        </div>

        <Breadcrumbs
          items={[
            ...(mostRecentDemarche
              ? [
                  {
                    label: mostRecentDemarche.titre,
                    href: makeCollectiviteDemarchePcaetDetailUrl({
                      collectiviteId,
                      demarchePcaetId: mostRecentDemarche.id,
                    }),
                  },
                ]
              : []),
            { label: appLabels.demarchePcaetPolluantsTitre },
          ]}
        />

        <Divider color="primary" className="my-3" />
      </div>

      <PolluantsAtmospheriquesView
        indicators={indicators}
        isSaving={false}
        onSave={handleSave}
      />
    </div>
  );
};
