import { appLabels } from '@/app/labels/catalog';
import {
  IndicateurPeriodes,
  type IndicateurPeriode,
} from '@tet/domain/indicateurs';
import { Button, TableCell, TableHeaderCell } from '@tet/ui';
import type { IndicateurPeriodeData } from '../data/prepare-indicateur-periode-data';
import { ADD_PERIODE_CELL_CLASSNAME } from './indicateur-valeurs-table.styles';

type Props = {
  periodes: readonly IndicateurPeriode[];
  resultats: IndicateurPeriodeData['donneesCollectivite'];
  objectifs: IndicateurPeriodeData['donneesCollectivite'];
  readonly?: boolean;
  periodicite: IndicateurPeriode['periodicite'];
  showAddPeriodeColumn: boolean;
  onComment: (periode: IndicateurPeriode) => void;
};

export const IndicateurValeursTableCommentairesFooter = ({
  periodes,
  resultats,
  objectifs,
  readonly,
  periodicite,
  showAddPeriodeColumn,
  onComment,
}: Props) => {
  if (!resultats && !objectifs) return null;

  const commentCounts = periodes.map(
    (periode) =>
      [resultats, objectifs].filter((source) =>
        source?.valeurs.some(
          (value) =>
            IndicateurPeriodes.key(value.periode) ===
              IndicateurPeriodes.key(periode) && value.commentaire
        )
      ).length
  );
  if (readonly && !commentCounts.some((count) => count > 0)) return null;

  return (
    <tfoot>
      <tr>
        <TableHeaderCell scope="row" className="border-r border-primary-4">
          <span className="sr-only">
            {appLabels.commentaires({ plural: true })}
          </span>
        </TableHeaderCell>
        {periodes.map((periode, index) => {
          const label = IndicateurPeriodes.format(periode);
          const commentCount = commentCounts[index];
          return (
            <TableCell
              key={IndicateurPeriodes.key(periode)}
              className="border-r border-primary-4 text-center"
            >
              {((!readonly && periode.periodicite === periodicite) ||
                commentCount > 0) && (
                <Button
                  icon="question-answer-line"
                  variant="outlined"
                  size="xs"
                  className="mx-auto"
                  notification={
                    commentCount ? { number: commentCount } : undefined
                  }
                  title={appLabels.indicateurCommentairesPeriode(label)}
                  aria-label={appLabels.indicateurCommentairesPeriode(label)}
                  onClick={() => onComment(periode)}
                  data-test="indicateurs.valeurs.commentaires"
                />
              )}
            </TableCell>
          );
        })}
        {showAddPeriodeColumn && (
          <TableCell className={ADD_PERIODE_CELL_CLASSNAME} />
        )}
      </tr>
    </tfoot>
  );
};
