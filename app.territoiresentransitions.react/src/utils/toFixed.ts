const approxEqual = (a: number, b: number) => Math.abs(a - b) < 0.0001;

export const toFixed = (n: number, d?: number) => {
  d = d === undefined ? 1 : d;
  if (approxEqual(Math.round(n), n)) return n.toFixed(d);
  else if (approxEqual(Math.round(n * 10), n * 10)) return n.toFixed();
  else return n.toFixed(d);
};
