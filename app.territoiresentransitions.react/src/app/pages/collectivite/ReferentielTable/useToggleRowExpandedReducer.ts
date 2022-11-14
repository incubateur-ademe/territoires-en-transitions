import {ActionType, TableState} from 'react-table';
import {useModifierStateRef} from './useModifierStateRef';
import {IAction, TActionsSubset} from './useReferentiel';

/**
 * Renvoi un `stateReducer` pour une instance react-table permettant de changer
 * le comportement de la fonction plier/déplier en fonction de l'état des
 * touches modificatrices.
 *
 * On aurait aussi pu créer un fork du hook `useExpanded` fourni par react-table
 * mais cela paraissait plus compliqué
 * Ref: https://github.com/TanStack/table/blob/v7/src/plugin-hooks/useExpanded.js
 */
export const useToggleRowExpandedReducer = <ActionSubset extends IAction>(
  rows: TActionsSubset<ActionSubset>
) => {
  // état courant des touches "modificatrices"
  const modifierStateRef = useModifierStateRef();

  // renvoi le reducer
  return (newState: TableState, action: ActionType) => {
    const {altKey, shiftKey} = modifierStateRef.current;

    // renvoi l'état inchangé si les touches ne sont pas enfoncées ou si c'est
    // une autre action
    if (!((altKey || shiftKey) && action.type === 'toggleRowExpanded')) {
      return newState;
    }

    const clickedId = action.id as string;

    const isExpanded = newState.expanded[clickedId] || false;
    const clickedDepth = getDepth(clickedId);

    // si la ligne cliquée va être dépliée...
    if (isExpanded) {
      // alors déplie toutes les lignes (ou uniquement celles de l'axe de
      // l'action cliquée si `shift` est enfoncé) dont le niveau est
      // inférieur ou égal au niveau de la ligne à déplier
      const rowsSubset = shiftKey ? getRowsByAxe(rows, clickedId) : rows;
      return {
        ...newState,
        expanded: rowsSubset.reduce(
          (newExpanded, {depth, identifiant}) => ({
            ...newExpanded,
            // une ligne sera dépliée si il y a une entrée clé/valeur `[id, true]`
            // dans l'objet `expanded` et est repliée si son id n'est pas dans
            // l'objet (l'entrée `[id, undefined]` supprime la clé de l'objet)
            [identifiant]: depth - 1 <= clickedDepth ? true : undefined,
          }),
          newState.expanded as Record<string, boolean | undefined>
        ),
      };
    }

    // sinon, replie toutes les lignes dont le niveau est supérieur ou
    // égal au niveau de la ligne à replier
    return {
      ...newState,
      expanded: Object.entries(newState.expanded).reduce(
        (expanded, [id, value]) => ({
          ...expanded,
          [id]: getDepth(id) >= clickedDepth ? undefined : value,
        }),
        {}
      ),
    };
  };
};

// renvoi le sous-ensemble des lignes appartenant au même axe
export const getRowsByAxe = <ActionSubset extends IAction>(
  rows: TActionsSubset<ActionSubset>,
  clickedId: string
) => {
  const axeId = clickedId.split('.')[0] + '.';
  return rows.filter(({identifiant}) => identifiant.startsWith(axeId));
};

// niveau de profondeur en fonction du nombre de points dans l'identifiant
export const getDepth = (identifiant: string) =>
  identifiant.split('.').length - 1;
