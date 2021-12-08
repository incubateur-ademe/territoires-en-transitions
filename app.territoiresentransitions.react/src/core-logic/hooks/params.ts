import {useParams} from 'react-router-dom';

export const useCollectiviteId = (): number | null => {
  const {collectiviteId} = useParams<{collectiviteId: string | undefined}>();
  return collectiviteId ? parseInt(collectiviteId) : null;
};
