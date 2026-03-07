import { cn, TableCell } from '@tet/ui';
import { ScoreProgressBar } from '../scores/score.progress-bar';
import { ReferentielTableRow } from './types';
import { actionTypeToClassName } from './utils';

type Props = {
  row: ReferentielTableRow;
};

export const ReferentielTableProgressBarCell = ({ row }: Props) => {
  const isAxeOrSousAxe = row.type === 'axe' || row.type === 'sous-axe';
  return (
    <TableCell className={cn(actionTypeToClassName[row.type])}>
      {isAxeOrSousAxe ? (
        ''
      ) : (
        <ScoreProgressBar
          id={row.id}
          identifiant={row.identifiant}
          type={row.type}
        />
      )}
    </TableCell>
  );
};
