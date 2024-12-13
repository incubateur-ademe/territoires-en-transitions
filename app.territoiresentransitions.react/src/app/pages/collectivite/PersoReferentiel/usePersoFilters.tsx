import { useSearchParams } from '@/app/core-logic/hooks/query';
import { Referentiel } from 'types/litterals';

export const usePersoFilters = () =>
  useSearchParams<{ referentiels: Referentiel[] }>(
    'personnalisation',
    { referentiels: ['eci', 'cae'] },
    { referentiels: 'r' }
  );
