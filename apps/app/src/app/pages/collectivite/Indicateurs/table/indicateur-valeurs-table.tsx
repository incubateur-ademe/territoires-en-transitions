import type { IndicateurDefinition } from '@/app/indicateurs/indicateurs/use-get-indicateur';
import { IndicateurValeursTableLegend } from '@/app/indicateurs/valeurs/grid/indicateur-valeurs.table-legend';
import { IndicateurValeursTableFrame } from '@/app/indicateurs/valeurs/grid/indicateur-valeurs.table-frame';
import { appLabels } from '@/app/labels/catalog';
import type { IndicateurPeriode } from '@tet/domain/indicateurs';
import { TableCell } from '@tet/ui';
import type { ReactNode } from 'react';
import type { IndicateurPeriodeData } from '../data/prepare-indicateur-periode-data';
import type { GetColorBySourceId } from '../data/use-indicateur-sources';
import type { SourceType } from '../types';
import { IndicateurValeursTableCommentairesFooter } from './indicateur-valeurs-table-commentaires.footer';
import { IndicateurValeursTableSourceRow } from './indicateur-valeurs-table-source.row';
import { IndicateurValeursTableHeader } from './indicateur-valeurs-table.header';
import { prepareIndicateurTableData } from './prepare-indicateur-table-data';

type Props = {
  definition: Pick<IndicateurDefinition, 'titre' | 'unite'>;
  resultats: IndicateurPeriodeData;
  objectifs: IndicateurPeriodeData;
  readonly?: boolean;
  confidentiel?: boolean;
  addPeriode?: ReactNode;
  getColorBySourceId: GetColorBySourceId;
  onSave: (
    periode: IndicateurPeriode,
    type: SourceType,
    value: number | null
  ) => Promise<boolean>;
  onDelete: (periode: IndicateurPeriode) => void;
  onComment: (periode: IndicateurPeriode) => void;
};

/** Results and objectives share a cell, while source versions remain separate. */
export const IndicateurValeursTable = ({
  definition,
  resultats,
  objectifs,
  readonly,
  confidentiel,
  addPeriode,
  getColorBySourceId,
  onSave,
  onDelete,
  onComment,
}: Props) => {
  const { sources, periodes } = prepareIndicateurTableData(
    resultats,
    objectifs
  );
  const showAddPeriodeColumn = Boolean(addPeriode);

  return (
    <div className="flex flex-col gap-2">
      <IndicateurValeursTableLegend />
      <IndicateurValeursTableFrame
        className="border-primary-3"
        maxHeight="none"
        layout="auto"
        role="table"
        aria-label={definition.titre}
        data-test="indicateurs.valeurs.table"
      >
        <IndicateurValeursTableHeader
          definition={definition}
          periodes={periodes}
          localValues={resultats.valeursExistantes}
          privatePeriode={confidentiel ? resultats.periodeModePrive : undefined}
          readonly={readonly}
          addPeriode={addPeriode}
          onDelete={onDelete}
        />
        <tbody>
          {readonly && periodes.length === 0 ? (
            <tr>
              <TableCell className="text-center text-sm text-grey-7">
                {appLabels.indicateurValeurAbsente}
              </TableCell>
            </tr>
          ) : (
            sources.map((row) => (
              <IndicateurValeursTableSourceRow
                key={row.key}
                row={row}
                periodes={periodes}
                readonly={readonly}
                showAddPeriodeColumn={showAddPeriodeColumn}
                getColorBySourceId={getColorBySourceId}
                onSave={onSave}
              />
            ))
          )}
        </tbody>
        <IndicateurValeursTableCommentairesFooter
          periodes={periodes}
          resultats={resultats.donneesCollectivite}
          objectifs={objectifs.donneesCollectivite}
          readonly={readonly}
          showAddPeriodeColumn={showAddPeriodeColumn}
          onComment={onComment}
        />
      </IndicateurValeursTableFrame>
    </div>
  );
};
