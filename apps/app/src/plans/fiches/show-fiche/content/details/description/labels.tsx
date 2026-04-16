import { appLabels } from '@/app/labels/catalog';
import { DescriptionFormValues } from './description-schema';

const fieldLabels: Record<
  keyof DescriptionFormValues,
  (params: { count: number }) => string
> = {
  description: appLabels.ficheDescription,
  objectifs: appLabels.ficheObjectifs,
  effetsAttendus: appLabels.ficheEffetsAttendus,
  thematiques: appLabels.ficheThematiques,
  sousThematiques: appLabels.ficheSousThematiques,
  libreTags: appLabels.ficheLibreTags,
};

export const getFieldLabel = (
  fieldName: keyof DescriptionFormValues,
  items: unknown[] | null | undefined | string
): string => {
  const count =
    !items || !Array.isArray(items) ? 1 : items.length > 1 ? items.length : 1;
  return fieldLabels[fieldName]({ count });
};
