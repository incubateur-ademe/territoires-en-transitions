import { TagEnum } from '@tet/domain/collectivites';
import { useListTags } from './use-list-tags';

export const useListPartenaires = ({
  collectiviteIds,
}: { collectiviteIds?: number[] } = {}) => {
  return useListTags({
    tagType: TagEnum.Partenaire,
    collectiviteIds,
  });
};
