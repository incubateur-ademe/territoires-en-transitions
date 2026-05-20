'use client';

import { appLabels } from '@/app/labels/catalog';
import { useToastContext } from '@/app/utils/toast/toast-context';
import { Button } from '@tet/ui';
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

type Props = {
  collectiviteId: number;
  isReadonly?: boolean;
};

export const PolluantsAtmospheriquesSection = ({
  collectiviteId,
  isReadonly = false,
}: Props): JSX.Element => {
  const { setToast } = useToastContext();
  const [referenceYear] = useState(() => new Date().getFullYear());
  const [indicators, setIndicators] = useState<IndicatorValues[]>(() =>
    getPolluantsIndicators({ collectiviteId, referenceYear })
  );

  const draft = useGridDraft();

  const handleSave = async (cells: DraftCell[]): Promise<boolean> => {
    const next = applyValuesToIndicators(indicators, cells);
    savePolluantsIndicators({ collectiviteId, indicators: next });
    setIndicators(next);
    setToast(
      'success',
      appLabels.demarchePcaetPolluantsValeursEnregistreesDemo
    );
    return true;
  };

  const handleReset = (): void => draft.reset();

  return (
    <div className="flex flex-col gap-4" data-test="PolluantsAtmospheriquesSection">
      {!isReadonly ? (
        <div className="flex flex-wrap items-center justify-end gap-2">
          {draft.pendingCount > 0 ? (
            <span className="text-sm text-grey-7">
              {appLabels.demarchePcaetPolluantsValeursEnAttente({
                count: draft.pendingCount,
              })}
            </span>
          ) : null}
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
      ) : null}

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
