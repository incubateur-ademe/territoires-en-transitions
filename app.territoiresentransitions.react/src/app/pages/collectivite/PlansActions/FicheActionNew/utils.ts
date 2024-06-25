import {differenceInCalendarDays, format} from 'date-fns';

export const getFormattedDate = (date: string) => {
  const localDate = date ? new Date(date) : new Date();
  return localDate.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  });
};

export const getTextFormattedDate = (date: string) => {
  const localDate = date ? new Date(date) : new Date();
  return localDate.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

export const getIsoFormattedDate = (date: string) => {
  const localDate = date ? new Date(date) : new Date();
  return localDate.toISOString().slice(0, 10);
};

export const getModifiedSince = (date: string) => {
  const modifiedDate = new Date(date);
  const diff = differenceInCalendarDays(new Date(), modifiedDate);

  if (diff === 0) {
    return "aujourd'hui";
  }
  if (diff === 1) {
    return 'il y a 1 jour';
  }
  if (diff < 7) {
    return `il y a ${diff} jours`;
  }
  if (diff < 14) {
    return 'il y a une semaine';
  }
  if (diff < 21) {
    return 'il y a 2 semaines';
  }
  if (diff < 28) {
    return 'il y a 3 semaines';
  }
  return `le ${format(modifiedDate, 'dd/MM/yyyy')}`;
};
