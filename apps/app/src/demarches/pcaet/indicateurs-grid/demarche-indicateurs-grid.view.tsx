'use client';

import { JSX, useMemo, useState } from 'react';
import { useToastContext } from '@/app/utils/toast/toast-context';
import {
  CellKey,
  GridCell,
  IndicateurValuesGrid,
} from '@/app/indicateurs/valeurs/grid';
import { buildDemarcheGridMock, VoletGridStructure } from './build-grid-mock';
import { useMockGridActions } from './use-mock-grid-actions';

export const DemarcheIndicateursGridView = ({
  structure,
}: {
  structure: VoletGridStructure;
}): JSX.Element => {
  const { setToast } = useToastContext();
  const mock = useMemo(
    () => buildDemarcheGridMock(structure, new Date().getFullYear()),
    [structure]
  );
  const [cells, setCells] = useState<Map<CellKey, GridCell>>(mock.cells);
  const actions = useMockGridActions(setCells);

  return (
    <IndicateurValuesGrid
      rows={mock.groups}
      years={mock.years}
      referenceYear={mock.referenceYear}
      unit={mock.unit}
      cells={cells}
      actions={actions}
      notify={(message) => setToast('success', message)}
    />
  );
};
