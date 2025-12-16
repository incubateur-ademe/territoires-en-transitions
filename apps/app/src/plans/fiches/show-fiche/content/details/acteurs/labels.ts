import { createGetFieldLabel } from '../field-labels.utils';
import { ActeursFormValues } from './acteurs-schema';

const FIELD_LABELS: Record<
  keyof ActeursFormValues,
  { singular: string; plural?: string }
> = {
  services: {
    singular: 'Direction ou service pilote',
    plural: 'Directions ou services pilotes',
  },
  structures: {
    singular: 'Structure pilote',
    plural: 'Structures pilotes',
  },
  referents: {
    singular: 'Élu·e référent·e',
    plural: 'Élu·e·s référent·e·s',
  },
  partenaires: {
    singular: 'Partenaire',
    plural: 'Partenaires',
  },
  cibles: {
    singular: 'Cible',
    plural: 'Cibles',
  },
  instanceGouvernance: {
    singular: 'Instance de gouvernance',
  },
  participationCitoyenne: {
    singular: 'Participation citoyenne',
  },
};

export const getFieldLabel = createGetFieldLabel(FIELD_LABELS);
