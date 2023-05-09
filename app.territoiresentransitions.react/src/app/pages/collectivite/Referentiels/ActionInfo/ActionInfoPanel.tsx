import {useState} from 'react';
import {ActionDefinitionSummary} from 'core-logic/api/endpoints/ActionDefinitionSummaryReadEndpoint';
import {ActionInfoSommaire} from './ActionInfoSommaire';
import {getItems} from './toc-items';
import {ActionInfoDetail} from './ActionInfoDetail';

export type TActionInfoProps = {action: ActionDefinitionSummary};

/**
 * Affiche les informations détaillées associées à une action (contextes,
 * exemples, ressources...)
 */
export const ActionInfoPanel = ({action}: TActionInfoProps) => {
  // items à afficher dans le sommaire
  const items = getItems(action);

  // item sélectionné (le 1er par défaut)
  const [current, setCurrent] = useState(items?.[0].id);
  const currentItem = items.find(({id}) => id === current);

  return (
    <>
      <ActionInfoSommaire
        items={items}
        current={current}
        setCurrent={setCurrent}
      />
      {currentItem ? (
        <ActionInfoDetail item={currentItem} actionId={action.id} />
      ) : null}
    </>
  );
};
