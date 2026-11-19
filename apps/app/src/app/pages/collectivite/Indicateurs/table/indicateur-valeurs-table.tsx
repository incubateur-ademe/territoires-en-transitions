import { PeriodesTable } from '@/app/indicateurs/valeurs/periodes-table/periodes-table';
import type { PeriodeTableCommentaires } from '@/app/indicateurs/valeurs/periodes-table/periodes-table.types';
import {
  IndicateurPeriodes,
  type IndicateurDetaille,
  type IndicateurPeriode,
} from '@tet/domain/indicateurs';
import { useRef, type ReactNode } from 'react';
import type { IndicateurPeriodeData } from '../data/prepare-indicateur-periode-data';
import type { SourceType } from '../types';
import { prepareIndicateurTableData } from './prepare-indicateur-table-data';
import { toSourceTableRows } from './to-source-table-rows';
import { useRevealIndicateurPeriode } from './use-reveal-indicateur-periode';

type Props = {
  indicateur: Pick<IndicateurDetaille, 'titre' | 'unite' | 'periodicite'>;
  resultats: IndicateurPeriodeData;
  objectifs: IndicateurPeriodeData;
  readonly?: boolean;
  confidentiel?: boolean;
  addPeriode?: ReactNode;
  periodeToReveal?: IndicateurPeriode;
  onSave: (
    periode: IndicateurPeriode,
    type: SourceType,
    value: number | null
  ) => Promise<boolean>;
  onDelete: (periode: IndicateurPeriode) => void;
  onComment: (periode: IndicateurPeriode) => void;
};

const toCommentaires = ({
  resultats,
  objectifs,
  readonly,
  periodicite,
  onComment,
}: Pick<Props, 'resultats' | 'objectifs' | 'readonly' | 'onComment'> & {
  periodicite: IndicateurPeriode['periodicite'];
}): PeriodeTableCommentaires | undefined => {
  const resultatsCollectivite = resultats.donneesCollectivite;
  const objectifsCollectivite = objectifs.donneesCollectivite;
  if (!resultatsCollectivite && !objectifsCollectivite) return undefined;
  return {
    isReadonly: Boolean(readonly),
    countOf: (periode) =>
      [resultatsCollectivite, objectifsCollectivite].filter((source) =>
        source?.valeurs.some(
          (value) =>
            IndicateurPeriodes.key(value.periode) ===
              IndicateurPeriodes.key(periode) && value.commentaire
        )
      ).length,
    canComment: (periode) => !readonly && periode.periodicite === periodicite,
    onComment,
  };
};

/** Results and objectives share a cell, while source versions remain separate. */
export const IndicateurValeursTable = ({
  indicateur,
  resultats,
  objectifs,
  readonly,
  confidentiel,
  addPeriode,
  periodeToReveal,
  onSave,
  onDelete,
  onComment,
}: Props) => {
  const { sources, periodes } = prepareIndicateurTableData(
    resultats,
    objectifs
  );
  const scrollRef = useRef<HTMLDivElement>(null);
  useRevealIndicateurPeriode(scrollRef, periodeToReveal, periodes);
  const privatePeriode = confidentiel ? resultats.periodeModePrive : undefined;

  return (
    <PeriodesTable
      title={indicateur.titre}
      unite={indicateur.unite}
      periodes={periodes}
      rows={toSourceTableRows({
        sources,
        readonly,
        periodicite: indicateur.periodicite,
        onSave,
      })}
      deletablePeriodeKeys={
        new Set(
          resultats.valeursExistantes.map(({ periode }) =>
            IndicateurPeriodes.key(periode)
          )
        )
      }
      privatePeriodeKey={
        privatePeriode ? IndicateurPeriodes.key(privatePeriode) : undefined
      }
      readonly={readonly}
      addPeriode={addPeriode}
      commentaires={toCommentaires({
        resultats,
        objectifs,
        readonly,
        periodicite: indicateur.periodicite,
        onComment,
      })}
      scrollRef={scrollRef}
      onDelete={onDelete}
    />
  );
};
