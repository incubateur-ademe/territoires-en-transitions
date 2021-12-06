import {useParams} from 'react-router-dom';

export const useEpciSiren = () => {
  const {epciSiren} = useParams<{epciSiren: string | undefined}>();
  return epciSiren;
};
