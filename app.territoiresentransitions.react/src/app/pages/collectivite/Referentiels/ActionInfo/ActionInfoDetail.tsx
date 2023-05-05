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

  return (
    <>
      <p className="bg-[#433EBA] text-white font-bold fr-px-3w fr-py-3v m-0">
        {titre}
      </p>
      <div className="overflow-y-auto fr-px-3w fr-pb-2w fr-mt-2w">
        {data ? (
          <div
            dangerouslySetInnerHTML={{__html: addTargetToContentAnchors(data)}}
          />
        ) : (
          '...'
        )}
      </div>
    </>
  );
};
