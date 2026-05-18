'use client';

import { useListIndicateurs } from '@/app/indicateurs/indicateurs/use-list-indicateurs';
import { useListIndicateurValeurs } from '@/app/indicateurs/valeurs/use-list-indicateur-valeurs';
import { useCollectiviteId } from '@tet/api/collectivites';
import { useMemo } from 'react';
import { fromIndicateur } from './adapters/indicateur-grid-adapter';
import {
  IndicateurGridShape,
  shapeIdentifiants,
  shapeToGridGroups,
} from './indicateur-grid-shape';
import {
  CellKey,
  generateCellKey,
  GridCell,
  GridGroups,
  toIndicateurId,
  Year,
} from './types';

export type IndicateurGridData = {
  groups: GridGroups;
  cells: Map<CellKey, GridCell>;
  identifiantReferentielByIndicateurId: Map<number, string>;
  unit: string;
  isLoading: boolean;
};

const emptyUserCell = (): GridCell => ({ resultat: null, objectif: null });

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

const emptyUserCells = (ids: number[], years: Year[]): Map<CellKey, GridCell> =>
  new Map(
    ids.flatMap((id) =>
      years.map((year): [CellKey, GridCell] => [
        generateCellKey(toIndicateurId(id), year),
        emptyUserCell(),
      ])
    )
  );

export const useIndicateurGridData = ({
  shape,
  years,
}: {
  shape: IndicateurGridShape;
  years: Year[];
}): IndicateurGridData => {
  const collectiviteId = useCollectiviteId();
  const identifiantsReferentiel = useMemo(
    () => shapeIdentifiants(shape).sort(),
    [shape]
  );

  const definitions = useListIndicateurs({
    collectiviteId,
    filters: { identifiantsReferentiel },
  });
  const valeurs = useListIndicateurValeurs({ identifiantsReferentiel });

  return useMemo<IndicateurGridData>(() => {
    const definitionItems = definitions.data?.data ?? [];
    const indicateurIdByIdentifiantReferentiel =
      toIndicateurIdByIdentifiantReferentiel(definitionItems);
    const baseCells = emptyUserCells(
      [...indicateurIdByIdentifiantReferentiel.values()],
      years
    );
    const filledCells = fromIndicateur(valeurs.data?.indicateurs ?? []);

    return {
      groups: shapeToGridGroups(shape, indicateurIdByIdentifiantReferentiel),
      cells: new Map([...baseCells, ...filledCells]),
      identifiantReferentielByIndicateurId: invertMap(
        indicateurIdByIdentifiantReferentiel
      ),
      unit: definitionItems[0]?.unite,
      isLoading: definitions.isLoading || valeurs.isLoading,
    };
  }, [
    shape,
    years,
    definitions.data,
    definitions.isLoading,
    valeurs.data,
    valeurs.isLoading,
  ]);
};
