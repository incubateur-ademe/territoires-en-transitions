import { appLabels } from '@/app/labels/catalog';
import {
  IndicateurPeriodes,
  type IndicateurPeriode,
} from '@tet/domain/indicateurs';
import { Button, Notification, TableHeaderCell, Tooltip } from '@tet/ui';
import { cn } from '@tet/ui/utils/cn';

type CellPeriodeListProps = {
  columns: readonly {
    periode: IndicateurPeriode;
    label: string;
    isPrivate: boolean;
    canDelete: boolean;
  }[];
  onDelete: (periode: IndicateurPeriode) => void;
};

/** Displays period headers independently of the annual value storage. */
export const CellPeriodeList = ({ columns, onDelete }: CellPeriodeListProps) =>
  columns.map(({ periode, label, isPrivate, canDelete }) => (
    <TableHeaderCell
      key={IndicateurPeriodes.key(periode)}
      scope="col"
      className={cn(
        'px-5 py-4 [&:not(:last-child)]:border-r border-primary-4 text-primary-9 text-xs font-bold text-center align-middle leading-normal relative w-[8.5rem]',
        {
          '!py-2': isPrivate,
        }
      )}
    >
      <div className="grid w-full grid-cols-[1fr_auto_1fr] items-center gap-1">
        {isPrivate && (
          <Tooltip
            label={<p className="min-w-max">{appLabels.resultatModePrive}</p>}
          >
            <div className="col-start-1 row-start-1">
              <Notification icon="lock-fill" classname="w-8 h-8" size="sm" />
            </div>
          </Tooltip>
        )}
        <span className="col-start-2 row-start-1 text-sm">{label}</span>
        {canDelete && (
          <Button
            className="col-start-3 row-start-1 justify-self-end !bg-transparent !border-none"
            icon="delete-bin-6-line"
            variant="outlined"
            size="xs"
            aria-label={appLabels.indicateurSupprimerPeriode(label)}
            onClick={() => onDelete(periode)}
          />
        )}
      </div>
    </TableHeaderCell>
  ));
