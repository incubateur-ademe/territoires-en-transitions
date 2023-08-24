export const getLocalDateString = (date: Date): string => {
  const newDate = new Date(date);

  const parsedDate = newDate.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return parsedDate;
};
