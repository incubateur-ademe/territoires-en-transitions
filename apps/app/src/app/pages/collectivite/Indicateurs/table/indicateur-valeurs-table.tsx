import { IndicateurValeursTableLegend } from '@/app/indicateurs/valeurs/grid/indicateur-valeurs.table-legend';
import { IndicateurValeursTableFrame } from '@/app/indicateurs/valeurs/grid/indicateur-valeurs.table-frame';
import { appLabels } from '@/app/labels/catalog';
import type {
  IndicateurPeriode,
  IndicateurDetaille,
} from '@tet/domain/indicateurs';
import { TableCell } from '@tet/ui';
import { useRef, type ReactNode } from 'react';
import type { IndicateurPeriodeData } from '../data/prepare-indicateur-periode-data';
import type { GetColorBySourceId } from '../data/use-indicateur-sources';
import type { SourceType } from '../types';
import { IndicateurValeursTableCommentairesFooter } from './indicateur-valeurs-table-commentaires.footer';
import { IndicateurValeursTableSourceRow } from './indicateur-valeurs-table-source.row';
import { IndicateurValeursTableHeader } from './indicateur-valeurs-table.header';
import { prepareIndicateurTableData } from './prepare-indicateur-table-data';
import { useRevealIndicateurPeriode } from './use-reveal-indicateur-periode';

type Props = {
  indicateur: Pick<IndicateurDetaille, 'titre' | 'unite' | 'periodicite'>;
  resultats: IndicateurPeriodeData;
  objectifs: IndicateurPeriodeData;
  readonly?: boolean;
  confidentiel?: boolean;
  addPeriode?: ReactNode;
  periodeToReveal?: IndicateurPeriode;
  getColorBySourceId: GetColorBySourceId;
  /** La source `snbc3` est servie : la SNBC 2 s'affiche « SNBC2 ». */
  avecSnbc3?: boolean;
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
  indicateur,
  resultats,
  objectifs,
  readonly,
  confidentiel,
  addPeriode,
  periodeToReveal,
  getColorBySourceId,
  avecSnbc3 = false,
  onSave,
  onDelete,
  onComment,
}: Props) => {
  const { sources, periodes } = prepareIndicateurTableData(
    resultats,
    objectifs
  );
  const showAddPeriodeColumn = Boolean(addPeriode);
  const scrollRef = useRef<HTMLDivElement>(null);
  useRevealIndicateurPeriode(scrollRef, periodeToReveal, periodes);

  return (
    <div className="flex flex-col gap-2">
      <IndicateurValeursTableLegend />
      <IndicateurValeursTableFrame
        scrollRef={scrollRef}
        persistentScrollbar
        className="border-primary-3"
        maxHeight="none"
        layout="auto"
        role="table"
        aria-label={indicateur.titre}
        data-test="indicateurs.valeurs.table"
      >
        <IndicateurValeursTableHeader
          indicateur={indicateur}
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
                {appLabels.aucuneDonneeDisponible}
              </TableCell>
            </tr>
          ) : (
            sources.map((row) => (
              <IndicateurValeursTableSourceRow
                key={row.key}
                row={row}
                periodes={periodes}
                readonly={readonly}
                periodicite={indicateur.periodicite}
                showAddPeriodeColumn={showAddPeriodeColumn}
                getColorBySourceId={getColorBySourceId}
                avecSnbc3={avecSnbc3}
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
          periodicite={indicateur.periodicite}
          showAddPeriodeColumn={showAddPeriodeColumn}
          onComment={onComment}
        />
      </IndicateurValeursTableFrame>
    </div>
  );
};
