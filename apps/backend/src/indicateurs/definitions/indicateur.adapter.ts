import {
  type Indicateur,
  type IndicateurDefinition,
  toIndicateur,
} from '@tet/domain/indicateurs';

export const toIndicateurOrThrow = (
  definition: IndicateurDefinition
): Indicateur => {
  const result = toIndicateur(definition);
  if (!result.success) {
    throw new Error(
      `Indicateur ${definition.id} : nature incohérente (${result.error})`
    );
  }
  return result.data;
};

export const toIndicateursOrThrow = (
  definitions: readonly IndicateurDefinition[]
): Indicateur[] =>
  definitions.map((definition) => toIndicateurOrThrow(definition));
