import { TagEnum } from '@tet/domain/collectivites';
import { useListTags } from './use-list-tags';

export const useListServices = ({
  collectiviteIds,
}: { collectiviteIds?: number[] } = {}) => {
  return useListTags({
    tagType: TagEnum.Service,
    collectiviteIds,
  });
};
