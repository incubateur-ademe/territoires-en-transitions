import { TagEnum } from '@tet/domain/collectivites';
import { useListTags } from './use-list-tags';

export const useListInstanceGouvernances = ({
  collectiviteIds,
}: {
  collectiviteIds?: number[];
} = {}) => {
  return useListTags({
    tagType: TagEnum.InstanceGouvernance,
    collectiviteIds,
  });
};
