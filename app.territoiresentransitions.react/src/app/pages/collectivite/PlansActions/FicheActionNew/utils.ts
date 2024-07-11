export const getFormattedDate = (date: string) => {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  });
};

export const getTextFormattedDate = (date: string) => {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

export const getIsoFormattedDate = (date: string) => {
  const localDate = new Date(date);
  return localDate.toISOString().slice(0, 10);
};
