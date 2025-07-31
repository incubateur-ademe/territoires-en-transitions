import { StatutAvancementIncludingNonConcerne } from '@/domain/referentiels';

export const actionAvancementColors: Record<
  StatutAvancementIncludingNonConcerne,
  string
> = {
  non_concerne: '#929292',
  non_renseigne: '#E5E5E5',
  pas_fait: '#FFCA79',
  programme: '#7AB1E8',
  detaille: '#000091',
  fait: '#34CB6A',
};
