import { useEffect, useState } from 'react';
import { TIndicateurDefinition, SourceType } from '../../types';
import { SOURCE_COLLECTIVITE } from '../../constants';
import { TIndicateurValeur } from '../../useIndicateurValeurs';
import {
  TEditIndicateurValeurHandlers,
  useEditIndicateurValeur,
} from './useEditIndicateurValeur';
import { useToggle } from 'ui/shared/useToggle';
import {
  ValueTableRowReadOnly,
  IndicateurValueTableRow,
} from './IndicateurValueTableRow';
import { Indicateurs } from '@tet/api';
import { Button } from '@tet/ui';

type IndicateurValuesTableProps = {
  definition: TIndicateurDefinition;
  type: SourceType;
  valeurs: TIndicateurValeur[];
  valeursBrutes: Indicateurs.domain.Valeur[];
  importSource?: string;
  isReadonly: boolean;
  confidentiel?: boolean;
};

/** Charge les données et affiche le tableau des valeurs */
export const IndicateurValuesTable = (props: IndicateurValuesTableProps) => {
  const { definition, type, valeurs, valeursBrutes } = props;
  const editHandlers = useEditIndicateurValeur({
    definition,
    type,
    valeursBrutes,
  });

  return (
    <ValuesTableBase values={valeurs} editHandlers={editHandlers} {...props} />
  );
};

// seuil au-dessus duquel afficher le bouton "Afficher tous les résultats"
const SHOW_MORE_THRESHOLD = 2;

/** Affiche le tableau des valeurs associées à un indicateur */
const ValuesTableBase = (
  props: IndicateurValuesTableProps & {
    values: TIndicateurValeur[];
    editHandlers: TEditIndicateurValeurHandlers;
  }
) => {
  const {
    type,
    values,
    definition,
    isReadonly,
    confidentiel,
    editHandlers,
    importSource,
  } = props;
  const { unite } = definition;
  const [showAll, toggleShowAll] = useToggle(false);
  const haveManyValues = values.length > SHOW_MORE_THRESHOLD;
  const valuesToShow =
    haveManyValues && !showAll ? values.slice(0, SHOW_MORE_THRESHOLD) : values;
  const [lastAddedYear, setLastAddedYear] = useState<number | null>(null);
  const sourceTypeLabel = type === 'resultat' ? 'résultat' : 'objectif';

  // affiche tous les résultats si la dernière ligne ajoutée ne fait pas partie
  // des lignes affichées par défaut
  useEffect(() => {
    if (
      lastAddedYear !== null &&
      !showAll &&
      valuesToShow.findIndex((v) => v.annee === lastAddedYear) === -1
    ) {
      toggleShowAll();
    }
  }, [lastAddedYear]);

  return (
    <table className="w-full fr-table fr-table--bordered fr-mb-0">
      <thead>
        <tr>
          <th className="w-2">&nbsp;</th>
          <th scope="col">Année</th>
          <th scope="col">
            {sourceTypeLabel[0].toUpperCase() + sourceTypeLabel.slice(1)}
            {unite && <span className="font-normal"> ({unite})</span>}
          </th>
          <th scope="col">Commentaires (Source, etc…)</th>
        </tr>
      </thead>
      <tbody>
        {isReadonly ? (
          valuesToShow.map((row, index) => (
            <ValueTableRowReadOnly key={`${row.type}-${row.annee}`} row={row} />
          ))
        ) : (
          <>
            {!importSource || importSource === SOURCE_COLLECTIVITE ? (
              <IndicateurValueTableRow
                key="new"
                type={type}
                values={values}
                editHandlers={editHandlers}
                onValueSaved={setLastAddedYear}
              />
            ) : null}
            {valuesToShow.map((row, index) => (
              <IndicateurValueTableRow
                key={`${row.type}-${row.annee}`}
                type={type}
                row={row}
                editHandlers={editHandlers}
                autoFocus={row.annee === lastAddedYear}
                confidentiel={
                  confidentiel &&
                  index === 0 &&
                  (!row.source || row.source === SOURCE_COLLECTIVITE)
                }
              />
            ))}
          </>
        )}
        {haveManyValues && (
          <tr>
            <td colSpan={4}>
              <Button
                aria-expanded={showAll}
                variant="underlined"
                icon={showAll ? 'arrow-up-s-line' : 'arrow-down-s-line'}
                iconPosition="right"
                size="sm"
                onClick={toggleShowAll}
              >
                {showAll
                  ? `Afficher uniquement les ${sourceTypeLabel}s récents`
                  : `Afficher tous les ${sourceTypeLabel}s`}
              </Button>
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
};
