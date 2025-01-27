import { useSearchParams } from '@/app/core-logic/hooks/query';
import { ReferentielId } from '@/domain/referentiels';

export const usePersoFilters = () =>
  useSearchParams<{ referentiels: ReferentielId[] }>(
    'personnalisation',
    { referentiels: ['eci', 'cae'] },
    { referentiels: 'r' }
  );
