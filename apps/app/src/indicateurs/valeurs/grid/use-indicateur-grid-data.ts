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
  identifiantById: Map<number, string>;
  unit: string | undefined;
  isLoading: boolean;
};

const emptyUserCell = (): GridCell => ({
  kind: 'user-data',
  value: null,
  coveringSources: [],
});

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
    const idByIdentifiant = new Map(
      definitionItems.flatMap((definition) =>
        definition.identifiantReferentiel === null
          ? []
          : [[definition.identifiantReferentiel, definition.id] as const]
      )
    );
    const identifiantById = new Map(
      definitionItems.flatMap((definition) =>
        definition.identifiantReferentiel === null
          ? []
          : [[definition.id, definition.identifiantReferentiel] as const]
      )
    );

    const baseCells = new Map<CellKey, GridCell>(
      [...idByIdentifiant.values()].flatMap((id) =>
        years.map(
          (year): [CellKey, GridCell] => [
            generateCellKey(toIndicateurId(id), year),
            emptyUserCell(),
          ]
        )
      )
    );
    const filledCells = fromIndicateur(
      valeurs.data?.indicateurs ?? [],
      referenceYear
    );

    return {
      groups: layoutToGridGroups(layout, idByIdentifiant),
      cells: applyOpenDataSelections(
        new Map([...baseCells, ...filledCells]),
        openDataSelections
      ),
      identifiantById,
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
