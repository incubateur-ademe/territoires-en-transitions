import { ObjectToSnake, objectToSnake } from 'ts-case-convert';

const emptyPreuveRelations = {
  action: null,
  preuve_reglementaire: null,
  demande: null,
  audit: null,
  rapport: null,
};

export function toPreuve<Row extends object>(
  preuve: Row
): typeof emptyPreuveRelations & ObjectToSnake<Row> {
  return {
    ...emptyPreuveRelations,
    ...objectToSnake(preuve),
  };
}
