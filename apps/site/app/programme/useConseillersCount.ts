import { fetchCollection } from '@/site/src/strapi/strapi';
import useSWR from 'swr';
import { Conseiller } from './annuaire/utils';

export const useConseillersCount = () => {
  return useSWR('conseillers-count', async () => {
    // Seul `meta.pagination.total` est lu : inutile de charger les lignes.
    const conseillers = await fetchCollection<Conseiller>('conseillers', [
      ['pagination[pageSize]', '1'],
    ]);
    return conseillers.meta.pagination.total;
  });
};
