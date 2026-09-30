import { JSX } from 'react';
import { getAuthorAndDate } from './document-label.utils';

export const DocumentLastModified = ({
  modifiedAt,
  modifiedByNom,
}: {
  modifiedAt: string | null;
  modifiedByNom: string | null;
}): JSX.Element | null => {
  const text = getAuthorAndDate(modifiedAt, modifiedByNom);

  if (text === null) {
    return null;
  }

  return <span className="text-grey-8 text-sm font-medium">{text}</span>;
};
