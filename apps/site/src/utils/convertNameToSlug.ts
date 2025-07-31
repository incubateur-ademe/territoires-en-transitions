export const convertNameToSlug = (name: string) => {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9 ]/g, '')
    .trim()
    .toLowerCase()
    .split(' ')
    .filter(el => el.length > 0)
    .join('-');
};
