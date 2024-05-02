import {useEffect, useState} from 'react';
import classNames from 'classnames';
import {TIndicateurDefinition, SOURCE_COLLECTIVITE, SourceType} from '../types';
import {
  TIndicateurValeurEtCommentaires,
  useIndicateurValeursEtCommentaires,
} from '../useIndicateurValeurs';
import {
  TEditIndicateurValeurHandlers,
  useEditIndicateurValeur,
} from './useEditIndicateurValeur';
import {useToggle} from 'ui/shared/useToggle';
import AnchorAsButton from 'ui/buttons/AnchorAsButton';
import {
  ValueTableRowReadOnly,
  IndicateurValueTableRow,
} from './IndicateurValueTableRow';

type IndicateurValuesTableProps = {
  definition: TIndicateurDefinition;
  type: SourceType;
  importSource?: string;
  isReadonly: boolean;
  confidentiel?: boolean;
};

/** Charge les données et affiche le tableau des valeurs */
export const IndicateurValuesTable = (props: IndicateurValuesTableProps) => {
  const {definition, type, importSource} = props;
  const {data: values} = useIndicateurValeursEtCommentaires({
    definition,
    type,
    importSource,
  });
  const editHandlers = useEditIndicateurValeur({definition, type});

  return values ? (
    <ValuesTableBase values={values} editHandlers={editHandlers} {...props} />
  ) : null;
};

// seuil au-dessus duquel afficher le bouton "Afficher tous les résultats"
const SHOW_MORE_THRESHOLD = 2;

/** Affiche le tableau des valeurs associées à un indicateur */
const ValuesTableBase = (
  props: IndicateurValuesTableProps & {
    values: TIndicateurValeurEtCommentaires[];
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
  const {unite} = definition;
  const [showAll, toggleShowAll] = useToggle(false);
  const haveManyValues = values.length > SHOW_MORE_THRESHOLD;
  const valuesToShow =
    haveManyValues && !showAll ? values.slice(0, SHOW_MORE_THRESHOLD) : values;
  const [lastAddedYear, setLastAddedYear] = useState<number | null>(null);

  // affiche tous les résultats si la dernière ligne ajoutée ne fait pas partie
  // des lignes affichées par défaut
  useEffect(() => {
    if (
      lastAddedYear !== null &&
      !showAll &&
      valuesToShow.findIndex(v => v.annee === lastAddedYear) === -1
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
            {type === 'resultat' ? 'Résultat' : 'Objectif'}
            {unite && <span className="font-normal"> ({unite})</span>}
          </th>
          <th scope="col">Commentaires</th>
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
                values={values}
                editHandlers={editHandlers}
                onValueSaved={setLastAddedYear}
              />
            ) : null}
            {valuesToShow.map((row, index) => (
              <IndicateurValueTableRow
                key={`${row.type}-${row.annee}`}
                row={row}
                editHandlers={editHandlers}
                autoFocus={row.annee === lastAddedYear}
                confidentiel={
                  confidentiel && index === 0 && row.type !== 'import'
                }
              />
            ))}
          </>
        )}
        {haveManyValues && (
          <tr>
            <td colSpan={4}>
              <AnchorAsButton
                className={classNames(
                  'fr-link--icon-right text-bf500',
                  showAll
                    ? 'fr-icon-arrow-up-s-line'
                    : 'fr-icon-arrow-down-s-line'
                )}
                onClick={toggleShowAll}
              >
                {showAll
                  ? 'Afficher uniquement les résultats récents'
                  : 'Afficher tous les résultats'}
              </AnchorAsButton>
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
};
