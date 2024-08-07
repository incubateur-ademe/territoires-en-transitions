import {differenceInCalendarDays, format} from 'date-fns';
import {fr} from 'date-fns/locale';

// Renvoie une date avec le mois en toutes lettres
export const getTextFormattedDate = ({
  date,
  shortMonth,
}: {
  date: string;
  shortMonth?: boolean;
}) => {
  const localDate = date ? new Date(date) : new Date();
  const dayOfMonth = format(localDate, 'd');

  if (dayOfMonth === '1') {
    return shortMonth
      ? format(localDate, 'do MMM yyyy', {locale: fr})
      : format(localDate, 'do MMMM yyyy', {locale: fr});
  } else
    return shortMonth
      ? format(localDate, 'd MMM yyyy', {locale: fr})
      : format(localDate, 'd MMMM yyyy', {locale: fr});
};

// Renvoie le format ISO d'une date avec uniquement jour mois et année
export const getIsoFormattedDate = (date: string) => {
  const localDate = date ? new Date(date) : new Date();
  return localDate.toISOString().slice(0, 10);
};

// Renvoie une durée entre une date donnée et aujourd'hui
export const getModifiedSince = (date: string) => {
  const modifiedDate = date ? new Date(date) : new Date();
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
