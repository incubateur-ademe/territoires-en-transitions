import { appLabels } from '@/app/labels/catalog';
import {
  IndicateurPeriodes,
  type IndicateurPeriode,
} from '@tet/domain/indicateurs';
import { Button, TableCell, TableHeaderCell } from '@tet/ui';
import { ADD_PERIODE_CELL_CLASSNAME } from './periodes-table.styles';
import type { PeriodeTableCommentaires } from './periodes-table.types';

type Props = {
  periodes: readonly IndicateurPeriode[];
  commentaires: PeriodeTableCommentaires;
  showAddPeriodeColumn: boolean;
};

export const hasCommentairesFooter = ({
  periodes,
  commentaires: { isReadonly, countOf },
}: Pick<Props, 'periodes' | 'commentaires'>): boolean =>
  periodes.length > 0 &&
  (!isReadonly || periodes.some((periode) => countOf(periode) > 0));

export const PeriodesTableCommentairesFooter = ({
  periodes,
  commentaires,
  showAddPeriodeColumn,
}: Props) => {
  if (!hasCommentairesFooter({ periodes, commentaires })) return null;

  const { countOf, canComment, onComment } = commentaires;
  const commentCounts = periodes.map(countOf);

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
              {(canComment(periode) || commentCount > 0) && (
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
