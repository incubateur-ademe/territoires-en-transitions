import { IndicateurDefinition } from '@/api/indicateurs/domain/definition.schema';
import { Button, HEAD_CELL_STYLE, Notification, TCell, Tooltip } from '@/ui';
import classNames from 'classnames';
import { SourceType } from '../types';
import { PreparedData, PreparedValue } from './prepare-data';

type CellAnneeListProps = {
  confidentiel?: boolean;
  data: PreparedData;
  definition: IndicateurDefinition;
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
          {modePrive && <ResultatModePrive />}
          <span className="w-full">{annee}</span>
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

const ResultatModePrive = () => (
  <Tooltip label={<p className="min-w-max">Le résultat est en mode privé</p>}>
    <div>
      <Notification icon="lock-fill" classname="!h-10 w-10" />
    </div>
  </Tooltip>
);
