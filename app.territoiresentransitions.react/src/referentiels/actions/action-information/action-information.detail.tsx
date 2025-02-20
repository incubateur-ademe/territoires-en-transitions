import { ActionDefinitionSummary } from '@/app/referentiels/ActionDefinitionSummaryReadEndpoint';
import { addTargetToContentAnchors } from '@/app/utils/content';
import { Ref, useEffect, useRef } from 'react';
import { TTOCItem } from './action-information.types';
import { useActionInfoData } from './use-action-information';

/**
 * Affiche une partie (exemples, ressources, etc.) des infos associées à une action
 */
export const ActionInfoDetail = ({
  item,
  action,
}: {
  item: TTOCItem;
  action: ActionDefinitionSummary;
}) => {
  const { id, label, num } = item;
  const titre = `${num}. ${label}`;
  const { data } = useActionInfoData(id, action);

  // positionnement au début du contenu lorsqu'on passe d'un item à un autre
  const ref: Ref<HTMLDivElement> = useRef(null);
  useEffect(() => {
    ref?.current?.scrollTo(0, 0);
  }, [data]);

  return (
    <>
      <p className="bg-primary text-white font-bold text-sm px-6 py-3 !m-0">
        {titre}
      </p>
      <div ref={ref} className="overflow-y-auto px-6 py-4">
        {data ? (
          <div
            className="text-sm"
            dangerouslySetInnerHTML={{
              __html: addTargetToContentAnchors(data).replaceAll(
                '<p>',
                '<p class="text-sm">'
              ),
            }}
          />
        ) : (
          '...'
        )}
      </div>
    </>
  );
};
