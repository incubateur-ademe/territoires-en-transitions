'use client';

import { useMemo } from 'react';
import { useCollectiviteId } from '@tet/api/collectivites';
import { fromIndicateur } from './adapters/indicateur-grid-adapter';
import { useListIndicateurs } from '@/app/indicateurs/indicateurs/use-list-indicateurs';
import { useListIndicateurValeurs } from '@/app/indicateurs/valeurs/use-list-indicateur-valeurs';
import {
  CellKey,
  GridCell,
  GridGroups,
  generateCellKey,
  SourceId,
  toIndicateurId,
  Year,
} from './types';
import { applyOpenDataSelections } from './apply-open-data-selections';
import {
  GridLayout,
  layoutIdentifiants,
  layoutToGridGroups,
} from './grid-layout';

export type IndicateurGridData = {
  groups: GridGroups;
  cells: Map<CellKey, GridCell>;
  identifiantReferentielByIndicateurId: Map<number, string>;
  unit: string | undefined;
  isLoading: boolean;
};

const emptyUserCell = (): GridCell => ({
  kind: 'user-data',
  value: null,
  coveringSources: [],
});

const toIndicateurIdByIdentifiantReferentiel = (
  definitions: { id: number; identifiantReferentiel: string | null }[]
): Map<string, number> =>
  new Map(
    definitions.flatMap((definition) =>
      definition.identifiantReferentiel === null
        ? []
        : [[definition.identifiantReferentiel, definition.id] as const]
    )
  );

const invertMap = <K, V>(map: Map<K, V>): Map<V, K> =>
  new Map([...map].map(([key, value]) => [value, key]));

const emptyUserCells = (
  ids: number[],
  years: Year[]
): Map<CellKey, GridCell> =>
  new Map(
    ids.flatMap((id) =>
      years.map((year): [CellKey, GridCell] => [
        generateCellKey(toIndicateurId(id), year),
        emptyUserCell(),
      ])
    )
  );

export const useIndicateurGridData = ({
  layout,
  referenceYear,
  years,
  openDataSelections,
}: {
  layout: GridLayout;
  referenceYear: Year;
  years: Year[];
  openDataSelections: Record<CellKey, SourceId>;
}): IndicateurGridData => {
  const collectiviteId = useCollectiviteId();
  const identifiantsReferentiel = useMemo(
    () => layoutIdentifiants(layout).sort(),
    [layout]
  );

  const definitions = useListIndicateurs({
    collectiviteId,
    filters: { identifiantsReferentiel },
  });
  const valeurs = useListIndicateurValeurs({ identifiantsReferentiel });

  return useMemo<IndicateurGridData>(() => {
    const definitionItems = definitions.data?.data ?? [];
    const indicateurIdByIdentifiantReferentiel = toIndicateurIdByIdentifiantReferentiel(definitionItems);
    const baseCells = emptyUserCells([...indicateurIdByIdentifiantReferentiel.values()], years);
    const filledCells = fromIndicateur(
      valeurs.data?.indicateurs ?? [],
      referenceYear
    );

    return {
      groups: layoutToGridGroups(layout, indicateurIdByIdentifiantReferentiel),
      cells: applyOpenDataSelections(
        new Map([...baseCells, ...filledCells]),
        openDataSelections
      ),
      identifiantReferentielByIndicateurId: invertMap(indicateurIdByIdentifiantReferentiel),
      unit: definitionItems[0]?.unite,
      isLoading: definitions.isLoading || valeurs.isLoading,
    };
  }, [
    layout,
    referenceYear,
    years,
    openDataSelections,
    definitions.data,
    definitions.isLoading,
    valeurs.data,
    valeurs.isLoading,
  ]);
};
