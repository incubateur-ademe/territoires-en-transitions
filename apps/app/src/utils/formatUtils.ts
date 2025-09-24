import { htmlToText } from '@/domain/utils';
import { differenceInCalendarDays, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import _ from 'lodash';

// Renvoie une date avec le mois en toutes lettres
export const getTextFormattedDate = ({
  date,
  shortMonth,
}: {
  date: string;
  shortMonth?: boolean;
}) => {
  const localDate = date ? new Date(date) : new Date();
  if (!isDateValid(date)) {
    return 'Date invalide';
  }
  const dayOfMonth = format(localDate, 'd');

  if (dayOfMonth === '1') {
    return shortMonth
      ? format(localDate, 'do MMM yyyy', { locale: fr })
      : format(localDate, 'do MMMM yyyy', { locale: fr });
  } else
    return shortMonth
      ? format(localDate, 'd MMM yyyy', { locale: fr })
      : format(localDate, 'd MMMM yyyy', { locale: fr });
};

// Renvoie le format ISO d'une date avec uniquement jour mois et année
export const getIsoFormattedDate = (date: string) => {
  if (!isDateValid(date)) {
    return '';
  }
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

// Renvoie un number formatté sous forme de string, avec un espace tous les 3 digits et un point virgule pour la virgule
export const getFormattedNumber = (nb: number) => {
  return nb
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
    .replace('.', ',');
};

export const getFormattedFloat = (nb: number) => {
  return nb
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
    .replace('.', ',');
};

// Message d'information sur le nombre de caractères pour les textarea
export const getMaxLengthMessage = (
  content: string,
  maxLength: number,
  // mettre à true pour supprimer le markup avant de calculer la taille
  isHTML = false
) => {
  const text = isHTML ? htmlToText(content) : content;
  if (text.length === maxLength) {
    return `Le nombre maximum de caractères a été atteint (${getFormattedNumber(
      maxLength
    )})`;
  } else {
    return `${getFormattedNumber(text.length)} / ${getFormattedNumber(
      maxLength
    )} caractères`;
  }
};

// Renvoie un texte tronqué
export const getTruncatedText = (text: string | null, limit: number) => {
  const truncatedText =
    text !== null
      ? _.truncate(text, {
        length: limit,
        separator: ' ',
        omission: '',
      })
      : null;

  const isTextTruncated = truncatedText !== text;

  return { truncatedText: `${truncatedText}...`, isTextTruncated };
};

export const isDateValid = (dateStr: string) => {
  return !isNaN(new Date(dateStr).getTime());
};
