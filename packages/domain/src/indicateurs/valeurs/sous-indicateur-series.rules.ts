import { groupBy } from 'es-toolkit';
import type { SousIndicateurSerie } from './indicateur-total.rules';

export type SousIndicateurRattache = Readonly<{
  id: number;
  parentId: number;
  confidentiel: boolean;
}>;

type SousIndicateursByParentId = Readonly<
  Record<number, readonly SousIndicateurRattache[] | undefined>
>;

const buildSeriesOf = ({
  indicateurId,
  sousIndicateursByParentId,
  valeursByIndicateurId,
}: {
  indicateurId: number;
  sousIndicateursByParentId: SousIndicateursByParentId;
  valeursByIndicateurId: Readonly<
    Record<number, SousIndicateurSerie['valeurs'] | undefined>
  >;
}): readonly SousIndicateurSerie[] =>
  (sousIndicateursByParentId[indicateurId] ?? []).map(
    ({ id, confidentiel }) => ({
      confidentiel,
      valeurs: valeursByIndicateurId[id] ?? [],
      sousIndicateurs: buildSeriesOf({
        indicateurId: id,
        sousIndicateursByParentId,
        valeursByIndicateurId,
      }),
    })
  );

export const buildSousIndicateurSeries = ({
  indicateurId,
  rattaches,
  valeursByIndicateurId,
}: {
  indicateurId: number;
  rattaches: readonly SousIndicateurRattache[];
  valeursByIndicateurId: Readonly<
    Record<number, SousIndicateurSerie['valeurs'] | undefined>
  >;
}): readonly SousIndicateurSerie[] =>
  buildSeriesOf({
    indicateurId,
    sousIndicateursByParentId: groupBy(rattaches, ({ parentId }) => parentId),
    valeursByIndicateurId,
  });
