const approxEqual = (a: number, b: number) => Math.abs(a - b) < 0.0001;

export const toFixed = (n: number) => {
  if (approxEqual(Math.round(n), n)) return n.toFixed(0);
  else if (approxEqual(Math.round(n * 10), n * 10)) return n.toFixed(1);
  else return n.toFixed(1);
};
