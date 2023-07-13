import classNames from 'classnames';
import {TIndicateurDefinition} from '../types';
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
import {useEffect, useState} from 'react';

/** Charge les données et affiche le tableau des valeurs */
export const IndicateurValuesTable = ({
  definition,
  type,
  isReadonly,
}: {
  definition: TIndicateurDefinition;
  type: 'resultat' | 'objectif';
  isReadonly: boolean;
}) => {
  const {data: values} = useIndicateurValeursEtCommentaires({definition, type});
  const editHandlers = useEditIndicateurValeur({definition, type});

  return values ? (
    <ValuesTableBase
      type={type}
      values={values}
      isReadonly={isReadonly}
      definition={definition}
      editHandlers={editHandlers}
    />
  ) : null;
};

// seuil au-dessus duquel afficher le bouton "Afficher tous les résultats"
const SHOW_MORE_THRESHOLD = 2;

/** Affiche le tableau des valeurs associées à un indicateur */
const ValuesTableBase = ({
  type,
  values,
  definition,
  isReadonly,
  editHandlers,
}: {
  type: 'resultat' | 'objectif';
  definition: TIndicateurDefinition;
  values: TIndicateurValeurEtCommentaires[];
  isReadonly: boolean;
  editHandlers: TEditIndicateurValeurHandlers;
}) => {
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
          valuesToShow.map(row => (
            <ValueTableRowReadOnly key={`${row.type}-${row.annee}`} row={row} />
          ))
        ) : (
          <>
            <IndicateurValueTableRow
              key="new"
              editHandlers={editHandlers}
              onValueSaved={setLastAddedYear}
            />
            {valuesToShow.map(row => (
              <IndicateurValueTableRow
                key={`${row.type}-${row.annee}`}
                row={row}
                editHandlers={editHandlers}
                autoFocus={row.annee === lastAddedYear}
              />
            ))}
          </>
        )}
        {haveManyValues && (
          <tr>
            <td colSpan={3}>
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
