import { ParticipationCitoyenne } from '@tet/domain/plans';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export const getFormattedNumber = (nb: number): string => {
  return nb
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
    .replace('.', ',');
};

export const generateTitle = (title?: string | null): string =>
  title || 'Sans titre';

const isDateValid = (date: string): boolean => {
  const d = new Date(date);
  return !isNaN(d.getTime());
};

export const getTextFormattedDate = ({
  date,
  shortMonth,
}: {
  date: string;
  shortMonth?: boolean;
}): string => {
  const localDate = date ? new Date(date) : new Date();
  if (!isDateValid(date)) {
    return 'Date invalide';
  }
  return format(localDate, shortMonth ? 'dd MMM yyyy' : 'dd MMMM yyyy', {
    locale: fr,
  });
};

export const getAuthorAndDate = (
  date: string | null,
  author: string | null
): string | null => {
  const formattedDate = date
    ? getTextFormattedDate({ date: date, shortMonth: true })
    : null;

  if (date || author) {
    return `Ajouté${date ? ` le ${formattedDate}` : ''}${
      author ? ` par ${author}` : ''
    }`;
  }
  return null;
};

type Options<T extends string> = {
  value: T;
  label: string;
};

export const ficheActionParticipationOptions: Options<ParticipationCitoyenne>[] =
  [
    {
      value: 'pas-de-participation',
      label: 'Pas de participation citoyenne',
    },
    { value: 'information', label: 'Information' },
    { value: 'consultation', label: 'Consultation' },
    { value: 'concertation', label: 'Concertation' },
    { value: 'co-construction', label: 'Co-construction' },
  ];
