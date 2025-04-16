import { fetchCollection } from '@/site/src/strapi/strapi';
import useSWR from 'swr';

export const useConseillersCount = () => {
  return useSWR('conseillers-count', async () => {
    const conseillers = await fetchCollection('conseillers');
    return conseillers.meta.pagination.total;
  });
};
