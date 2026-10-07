import { appLabels } from '@/app/labels/catalog';
import { capitalize } from '@tet/ui/labels/plural';
import { DescriptionFormValues } from './description-schema';

const fieldLabels: Record<
  keyof DescriptionFormValues,
  (params?: { plural: boolean }) => string
> = {
  description: () => capitalize(appLabels.description()),
  objectifs: () => `${capitalize(appLabels.ficheObjectif())}(s) :`,
  effetsAttendus: appLabels.ficheEffetsAttendus,
  thematiques: appLabels.thematique,
  sousThematiques: appLabels.sousThematique,
  libreTags: appLabels.ficheLibreTag,
};

export const getFieldLabel = (
  fieldName: keyof DescriptionFormValues,
  items: unknown[] | null | undefined | string
): string => {
  const count = !items || !Array.isArray(items) ? 0 : items.length;
  if (count > 1) {
    return fieldLabels[fieldName]({ plural: true });
  }

  return fieldLabels[fieldName]();
};
