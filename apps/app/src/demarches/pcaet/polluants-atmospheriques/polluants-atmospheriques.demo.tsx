'use client';

import { makeCollectiviteDemarchePcaetDetailUrl } from '@/app/app/paths';
import { appLabels } from '@/app/labels/catalog';
import { listDemarchesPcaet } from '@/app/demarches/pcaet/demarche-pcaet.storage';
import { useToastContext } from '@/app/utils/toast/toast-context';
import { useCollectiviteId } from '@tet/api/collectivites';
import { Breadcrumbs, Button, PageHeader } from '@tet/ui';
import { JSX, useState } from 'react';
import { IndicatorValues } from './grid-model';
import { applyValuesToIndicators } from './indicator-values-source';
import {
  getPolluantsIndicators,
  savePolluantsIndicators,
} from './polluants-atmospheriques.storage';
import {
  DraftCell,
  PolluantsAtmospheriquesView,
  useGridDraft,
} from './polluants-atmospheriques.view';

export const PolluantsAtmospheriquesDemo = (): JSX.Element => {
  const collectiviteId = useCollectiviteId();
  const { setToast } = useToastContext();
  const [referenceYear] = useState(() => new Date().getFullYear());
  const [indicators, setIndicators] = useState<IndicatorValues[]>(() =>
    getPolluantsIndicators({ collectiviteId, referenceYear })
  );

  const draft = useGridDraft();
  const mostRecentDemarche = listDemarchesPcaet(collectiviteId)[0];

  const handleSave = async (cells: DraftCell[]): Promise<boolean> => {
    const next = applyValuesToIndicators(indicators, cells);
    savePolluantsIndicators({ collectiviteId, indicators: next });
    setIndicators(next);
    setToast('success', appLabels.demarchePcaetPolluantsValeursEnregistreesDemo);
    return true;
  };

  const handleReset = (): void => draft.reset();

  return (
    <div
      className="flex flex-col gap-4 pb-12"
      data-test="PolluantsAtmospheriquesPage"
    >
      <PageHeader>
        <PageHeader.Title>
          {appLabels.demarchePcaetPolluantsTitre}
        </PageHeader.Title>

        <PageHeader.Actions>
          <div className="flex items-center gap-2">
            {draft.pendingCount > 0 && (
              <span className="text-sm text-grey-7">
                {appLabels.demarchePcaetPolluantsValeursEnAttente({
                  count: draft.pendingCount,
                })}
              </span>
            )}
            <Button
              size="sm"
              variant="outlined"
              onClick={handleReset}
              disabled={draft.pendingCount === 0}
            >
              {appLabels.demarchePcaetPolluantsAnnulerModifications}
            </Button>
            <Button
              size="sm"
              disabled={draft.pendingCount === 0}
              onClick={() => handleSave(draft.cells)}
            >
              {appLabels.valider}
            </Button>
          </div>
        </PageHeader.Actions>

        <PageHeader.Subtitle>
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
        </PageHeader.Subtitle>
      </PageHeader>

      <PolluantsAtmospheriquesView
        indicators={indicators}
        isSaving={false}
        draft={draft}
        onSave={handleSave}
        onReset={handleReset}
      />
    </div>
  );
};
