export const getLocalDateString = (date: Date): string => {
  const newDate = new Date(date);

  const parsedDate = newDate.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'Europe/Paris',
  });

  if (newDate.getDate() === 1) {
    const dateArray = parsedDate.split(' ');
    dateArray.splice(0, 1, '1er');
    return dateArray.join(' ');
  }

  return parsedDate;
};
