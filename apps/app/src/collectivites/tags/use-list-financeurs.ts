import { TagEnum } from '@tet/domain/collectivites';
import { useListTags } from './use-list-tags';

export const useListFinanceurs = ({
  collectiviteIds,
}: { collectiviteIds?: number[] } = {}) => {
  return useListTags({
    tagType: TagEnum.Financeur,
    collectiviteIds,
  });
};
