export const toFixed = (n: number, d = 1) => {
  return Number(Number(`${n}e${d}`).toFixed() + `e-${d}`);
};
