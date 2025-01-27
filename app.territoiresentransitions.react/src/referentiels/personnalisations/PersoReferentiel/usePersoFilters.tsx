import { useSearchParams } from '@/app/core-logic/hooks/query';
import { Referentiel } from '@/app/referentiels/litterals';

export const usePersoFilters = () =>
  useSearchParams<{ referentiels: Referentiel[] }>(
    'personnalisation',
    { referentiels: ['eci', 'cae'] },
    { referentiels: 'r' }
  );
