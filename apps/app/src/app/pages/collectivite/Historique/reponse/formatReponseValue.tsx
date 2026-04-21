import { toPercentString } from '@/app/utils/to-percent-string';

export const formatReponseValue = (
  value: unknown,
  type: string | null
) => {
  if (value === null || value === undefined) {
    return <i>Non renseigné</i>;
  }

  if (type === 'binaire') {
    return value ? 'Oui' : 'Non';
  }

  if (type === 'proportion') {
    return toPercentString(value as number);
  }
  return value as string;
};
