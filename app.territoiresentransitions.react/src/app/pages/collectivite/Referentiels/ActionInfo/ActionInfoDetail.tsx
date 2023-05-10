import {Ref, useEffect, useRef} from 'react';
import {addTargetToContentAnchors} from 'utils/content';
import {TTOCItem} from './type';
import {useActionInfoData} from './useActionInfoData';

/**
 * Affiche une partie (exemples, ressources, etc.) des infos associées à une action
 */
export const ActionInfoDetail = ({
  item,
  actionId,
}: {
  item: TTOCItem;
  actionId: string;
}) => {
  const {id, label, num} = item;
  const titre = `${num}. ${label}`;
  const {data} = useActionInfoData(id, actionId);

  // positionnement au début du contenu lorsqu'on passe d'un item à un autre
  const ref: Ref<HTMLDivElement> = useRef(null);
  useEffect(() => {
    ref?.current?.scrollTo(0, 0);
  }, [data]);

  return (
    <>
      <p className="bg-[#433EBA] text-white font-bold fr-text--sm fr-px-3w fr-py-3v !m-0">
        {titre}
      </p>
      <div ref={ref} className="overflow-y-auto fr-px-3w fr-py-2w">
        {data ? (
          <div
            className="fr-text--sm"
            dangerouslySetInnerHTML={{
              __html: addTargetToContentAnchors(data).replaceAll(
                '<p>',
                '<p class="fr-text--sm">'
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
