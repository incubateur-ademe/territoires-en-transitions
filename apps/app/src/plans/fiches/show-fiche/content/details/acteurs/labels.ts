import { plural } from '@tet/ui/labels/plural';
import { ActeursFormValues } from './acteurs-schema';

const fieldLabels: Record<keyof ActeursFormValues, ReturnType<typeof plural>> = {
  services: plural({
    one: 'Direction ou service pilote',
    other: 'Directions ou services pilotes',
  }),
  structures: plural({
    one: 'Structure pilote',
    other: 'Structures pilotes',
  }),
  referents: plural({
    one: 'Élu·e référent·e',
    other: 'Élu·e·s référent·e·s',
  }),
  partenaires: plural({
    one: 'Partenaire',
    other: 'Partenaires',
  }),
  cibles: plural({
    one: 'Cible',
    other: 'Cibles',
  }),
  instanceGouvernance: plural({
    one: 'Instance de gouvernance',
    other: 'Instance de gouvernance',
  }),
  participationCitoyenne: plural({
    one: 'Participation citoyenne',
    other: 'Participation citoyenne',
  }),
};

export const getFieldLabel = (
  fieldName: keyof ActeursFormValues,
  items: unknown[] | null | undefined | string
): string => {
  const count =
    !items || !Array.isArray(items) ? 1 : items.length > 1 ? items.length : 1;
  return fieldLabels[fieldName]({ count });
};
