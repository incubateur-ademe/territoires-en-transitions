import { useQuery } from '@tanstack/react-query';
import { getConseillersCount } from './annuaire/utils';

export const useConseillersCount = () =>
  useQuery({ queryKey: ['conseillers-count'], queryFn: getConseillersCount });
