import useSWR from 'swr';
import { getConseillersCount } from './annuaire/utils';

export const useConseillersCount = () =>
  useSWR('conseillers-count', getConseillersCount);
