import {Referentiel} from 'types/litterals';
import {useSearchParams} from 'core-logic/hooks/query';

export const usePersoFilters = () =>
  useSearchParams<{referentiels: Referentiel[]}>(
    'personnalisation',
    {referentiels: ['eci', 'cae']},
    {referentiels: 'r'}
  );
