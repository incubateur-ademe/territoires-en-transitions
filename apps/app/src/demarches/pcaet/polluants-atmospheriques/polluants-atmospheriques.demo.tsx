'use client';

import { appLabels } from '@/app/labels/catalog';
import { useToastContext } from '@/app/utils/toast/toast-context';
import { useCollectiviteId } from '@tet/api/collectivites';
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

  const handleSave = (cells: DraftCell[]): Promise<boolean> => {
    const next = applyValuesToIndicators(indicators, cells);
    savePolluantsIndicators({ collectiviteId, indicators: next });
    setIndicators(next);
    setToast('success', appLabels.demarchePcaetPolluantsValeursEnregistreesDemo);
    return Promise.resolve(true);
  };

  return (
    <PolluantsAtmospheriquesView
      indicators={indicators}
      isSaving={false}
      onSave={handleSave}
    />
  );
};
