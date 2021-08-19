import {useParams} from 'react-router-dom';

export const useEpciId = () => {
  const {epciId} = useParams<{epciId: string}>();
  return epciId;
};
