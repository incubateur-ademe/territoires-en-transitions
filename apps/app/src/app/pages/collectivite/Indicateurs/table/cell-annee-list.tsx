import { Button, HEAD_CELL_STYLE, Notification, TCell, Tooltip } from '@/ui';
import classNames from 'classnames';
import { PreparedData, PreparedValue } from '../data/prepare-data';
import { SourceType } from '../types';

type CellAnneeListProps = {
  confidentiel?: boolean;
  data: PreparedData & { annees: number[] };
  readonly?: boolean;
  type: SourceType;
  onDelete: (valeur: PreparedValue) => void;
};

/** Affiche les cellules des années dans l'en-tête du tableau */
export const CellAnneeList = ({
  confidentiel,
  data,
  readonly,
  type,
  onDelete,
}: CellAnneeListProps) => {
  const { annees, anneeModePrive, valeursExistantes } = data;

  return annees?.map((annee) => {
    const valeur = valeursExistantes.find((v) => v.annee === annee);
    const modePrive =
      confidentiel && type === 'resultat' && annee === anneeModePrive;

    return (
      <TCell
        key={annee}
        className={classNames(
          HEAD_CELL_STYLE,
          'font-bold text-center relative w-[8.5rem]',
          { '!py-2': modePrive }
        )}
      >
        <div className="flex items-center justify-between">
          {modePrive && (
            <Tooltip
              label={<p className="min-w-max">Le résultat est en mode privé</p>}
            >
              <div>
                <Notification icon="lock-fill" classname="w-8 h-8" size="sm" />
              </div>
            </Tooltip>
          )}
          <span className="w-full text-sm">{annee}</span>
          {valeur && !readonly && (
            <Button
              className="!bg-transparent !border-none"
              icon="delete-bin-6-line"
              variant="outlined"
              size="xs"
              onClick={() => onDelete(valeur)}
            />
          )}
        </div>
      </TCell>
    );
  });
};
