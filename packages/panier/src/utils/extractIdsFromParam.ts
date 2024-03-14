export const extractIdsFromParam = (param: string | undefined): number[] => {
  return param?.split(',').map(n => parseInt(n)) ?? [];
};
