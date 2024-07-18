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
