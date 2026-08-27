import { appLabels } from '@/app/labels/catalog';
import { plural } from '@tet/ui/labels/plural';
import { ActeursFormValues } from './acteurs-schema';

const fieldLabels: Record<
  keyof ActeursFormValues,
  ReturnType<typeof plural>
> = {
  services: appLabels.directionOuServicePilote,
  structures: appLabels.ficheStructurePilote,
  referents: appLabels.personneElue,
  partenaires: appLabels.fichePartenaire,
  cibles: appLabels.ficheCible,
  instanceGouvernance: appLabels.ficheInstanceGouvernance,
  participationCitoyenne: appLabels.ficheParticipationCitoyenne,
};

export const getFieldLabel = (
  fieldName: keyof ActeursFormValues,
  items: unknown[] | null | undefined | string
): string => {
  const count = !items || !Array.isArray(items) ? 0 : items.length;
  if (count > 1) {
    return fieldLabels[fieldName]({ plural: true });
  }

  return fieldLabels[fieldName]();
};
