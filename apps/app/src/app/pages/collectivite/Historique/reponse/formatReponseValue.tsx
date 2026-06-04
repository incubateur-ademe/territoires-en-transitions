import { toPercentString } from '@/app/utils/to-percent-string';
import { appLabels } from '@/app/labels/catalog';

export const formatReponseValue = (
  value: unknown,
  type: string | null
) => {
  if (value === null || value === undefined) {
    return <i>{appLabels.nonRenseigne}</i>;
  }

  if (type === 'binaire') {
    return value ? 'Oui' : 'Non';
  }

  if (type === 'proportion') {
    return toPercentString(value as number);
  }
  return value as string;
};
