import { createGetFieldLabel } from '../field-labels.utils';
import { DescriptionFormValues } from './description-schema';

const FIELD_LABELS: Record<
  keyof DescriptionFormValues,
  { singular: string; plural?: string }
> = {
  description: {
    singular: 'Description',
  },
  effetsAttendus: {
    singular: 'Effet attendu',
    plural: 'Effets attendus',
  },
  objectifs: {
    singular: 'Objectif',
  },
  thematiques: {
    singular: 'Thématique',
    plural: 'Thématiques',
  },
  sousThematiques: {
    singular: 'Sous-thématique',
    plural: 'Sous-thématiques',
  },
  libreTags: {
    singular: 'Tag personnalisé',
    plural: 'Tags personnalisés',
  },
};

export const getFieldLabel = createGetFieldLabel(FIELD_LABELS);
