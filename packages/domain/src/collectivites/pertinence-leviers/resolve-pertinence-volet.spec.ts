import { describe, expect, it } from 'vitest';
import { Pertinence, pertinenceEnumValues } from './pertinence.enum';
import { resolvePertinenceVolet } from './resolve-pertinence-volet';

type OptionalPertinence = Pertinence | undefined;

type ResolutionCase = {
  levierPertinence: OptionalPertinence;
  voletPertinence: OptionalPertinence;
};

const optionalPertinences: OptionalPertinence[] = [
  ...pertinenceEnumValues,
  undefined,
];

const nonInheritingLevierPertinences: OptionalPertinence[] =
  optionalPertinences.filter((pertinence) => pertinence !== 'non_pertinent');

const toResolutionCases = (
  levierPertinences: OptionalPertinence[],
  voletPertinences: OptionalPertinence[]
): ResolutionCase[] =>
  levierPertinences.flatMap((levierPertinence) =>
    voletPertinences.map((voletPertinence) => ({
      levierPertinence,
      voletPertinence,
    }))
  );

const mobiliseCases = toResolutionCases(
  optionalPertinences,
  optionalPertinences
);
const heriteeCases = toResolutionCases(['non_pertinent'], optionalPertinences);
const propreWithPertinenceCases = toResolutionCases(
  nonInheritingLevierPertinences,
  [...pertinenceEnumValues]
);
const propreWithoutPertinenceCases = toResolutionCases(
  nonInheritingLevierPertinences,
  [undefined]
);

describe('resolvePertinenceVolet', () => {
  it.each(mobiliseCases)(
    'rend mobilisé un volet mobilisé, levier $levierPertinence et volet $voletPertinence',
    ({ levierPertinence, voletPertinence }) => {
      expect(
        resolvePertinenceVolet({
          isMobilise: true,
          levierPertinence,
          voletPertinence,
        })
      ).toStrictEqual({ kind: 'mobilise' });
    }
  );

  it.each(heriteeCases)(
    "fait hériter un volet non mobilisé d'un levier non pertinent, volet $voletPertinence",
    ({ levierPertinence, voletPertinence }) => {
      expect(
        resolvePertinenceVolet({
          isMobilise: false,
          levierPertinence,
          voletPertinence,
        })
      ).toStrictEqual({ kind: 'heritee_du_levier' });
    }
  );

  it.each(propreWithPertinenceCases)(
    "reprend la pertinence $voletPertinence d'un volet non mobilisé, levier $levierPertinence",
    ({ levierPertinence, voletPertinence }) => {
      expect(
        resolvePertinenceVolet({
          isMobilise: false,
          levierPertinence,
          voletPertinence,
        })
      ).toStrictEqual({ kind: 'propre', pertinence: voletPertinence });
    }
  );

  it.each(propreWithoutPertinenceCases)(
    "laisse non renseignée la pertinence d'un volet non mobilisé et non qualifié, levier $levierPertinence",
    ({ levierPertinence, voletPertinence }) => {
      expect(
        resolvePertinenceVolet({
          isMobilise: false,
          levierPertinence,
          voletPertinence,
        })
      ).toStrictEqual({ kind: 'propre' });
    }
  );
});
