import { TagEnum } from '@tet/domain/collectivites';
import { useListTags } from './use-list-tags';

export const useListStructures = ({
  collectiviteIds,
}: {
  collectiviteIds?: number[];
} = {}) => {
  return useListTags({
    tagType: TagEnum.Structure,
    collectiviteIds,
  });
};
