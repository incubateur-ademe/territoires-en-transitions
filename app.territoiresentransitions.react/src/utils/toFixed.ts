export const toFixed = (n: number, d = 1) => {
  return Number(Number(`${n}e${d}`).toFixed() + `e-${d}`);
};

export const toLocaleFixed = (n: number, maximumFractionDigits = 1): string =>
  n.toLocaleString(undefined, {maximumFractionDigits});
