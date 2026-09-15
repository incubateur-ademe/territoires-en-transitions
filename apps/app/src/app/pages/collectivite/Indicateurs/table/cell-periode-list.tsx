import {
  Button,
  DEPRECATED_HEAD_CELL_STYLE,
  DEPRECATED_TCell,
  Notification,
  Tooltip,
} from '@tet/ui';
import classNames from 'classnames';
import { PreparedData, PreparedValue } from '../data/prepare-data';
import { SourceType } from '../types';
import { appLabels } from '@/app/labels/catalog';
import {
  formatIndicateurPeriod,
  IndicateurPeriods,
} from '@tet/domain/indicateurs';

type CellPeriodeListProps = {
  confidentiel?: boolean;
  data: PreparedData;
  readonly?: boolean;
  type: SourceType;
  onDelete: (valeur: PreparedValue) => void;
};

/** Affiche les cellules des périodes dans l'en-tête du tableau. */
export const CellPeriodeList = ({
  confidentiel,
  data,
  readonly,
  type,
  onDelete,
}: CellPeriodeListProps) => {
  const { periodes, dernierePeriodeModePrive, valeursExistantes } = data;

  return periodes?.map((periode) => {
    const periodKey = IndicateurPeriods.key(periode);
    const valeur = valeursExistantes.find(
      (v) => IndicateurPeriods.key(v.periode) === periodKey
    );
    const modePrive =
      confidentiel &&
      type === 'resultat' &&
      dernierePeriodeModePrive !== undefined &&
      periodKey === IndicateurPeriods.key(dernierePeriodeModePrive);

    return (
      <DEPRECATED_TCell
        key={periodKey}
        className={classNames(
          DEPRECATED_HEAD_CELL_STYLE,
          'font-bold text-center relative w-[8.5rem]',
          { '!py-2': modePrive }
        )}
      >
        <div className="flex items-center justify-between">
          {modePrive && (
            <Tooltip
              label={<p className="min-w-max">{appLabels.resultatModePrive}</p>}
            >
              <div>
                <Notification icon="lock-fill" classname="w-8 h-8" size="sm" />
              </div>
            </Tooltip>
          )}
          <span className="w-full text-sm">
            {formatIndicateurPeriod(periode)}
          </span>
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
      </DEPRECATED_TCell>
    );
  });
};
