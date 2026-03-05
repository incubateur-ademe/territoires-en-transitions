import { TagEnum } from '@tet/domain/collectivites';
import { useListTags } from './use-list-tags';

export const useListLibreTags = ({
  collectiviteIds,
}: { collectiviteIds?: number[] } = {}) => {
  return useListTags({
    tagType: TagEnum.Libre,
    collectiviteIds,
  });
};
