import { RouterOutput } from '@tet/api';
import { PertinenceLevier } from '@tet/domain/collectivites';
import {
  categorieActionEnumValues,
  LEVIER_ID_BY_NOM,
  Levier,
  LevierId,
} from '@tet/domain/shared';
import { meanBy, round } from 'es-toolkit';
import { LevierCard, Mobilisation, toLevierCards } from './to-levier-cards';

export type TrajectoireLeviers =
  RouterOutput['indicateurs']['trajectoires']['leviers']['getData'];

export type PotentielsReduction =
  | { status: 'indisponible' }
  | { status: 'disponible'; byLevier: Map<LevierId, number> };

export type LevierPriorisation = LevierCard & {
  mobilisationScore: number;
  potentielReduction?: number;
};

const NOTE_MAX = 3;

const SCORE_MAX = 100;

const isLevierNom = (nom: string): nom is Levier => nom in LEVIER_ID_BY_NOM;

const toPotentielReduction = (objectifReduction: number): number =>
  Math.max(0, -objectifReduction);

export const toPotentielsReduction = (
  trajectoire: TrajectoireLeviers
): PotentielsReduction => ({
  status: 'disponible',
  byLevier: new Map(
    trajectoire.secteurs
      .flatMap(({ leviers }) => leviers)
      .flatMap(({ nom, objectifReduction }) => {
        const isUnknownOrWithoutObjectif =
          !isLevierNom(nom) || objectifReduction === null;
        if (isUnknownOrWithoutObjectif) {
          return [];
        }
        return [
          [LEVIER_ID_BY_NOM[nom], toPotentielReduction(objectifReduction)],
        ] as const;
      })
  ),
});

const toMobilisationScore = (
  volets: Mobilisation['leviers'][number]['volets']
): number => {
  const noteByCategorie = new Map(
    volets.map(({ categorie, note }) => [categorie, note])
  );
  const mean = meanBy(
    categorieActionEnumValues,
    (categorie) => noteByCategorie.get(categorie) ?? 0
  );
  return round((mean / NOTE_MAX) * SCORE_MAX);
};

const toMobilisationScoreByLevier = (
  mobilisation: Mobilisation
): Map<LevierId, number> =>
  new Map(
    mobilisation.leviers.map(({ levierId, volets }) => [
      levierId,
      toMobilisationScore(volets),
    ])
  );

const withPotentiel = (
  levier: LevierPriorisation,
  potentiels: PotentielsReduction
): LevierPriorisation => {
  if (potentiels.status === 'indisponible') {
    return levier;
  }
  const potentielReduction = potentiels.byLevier.get(levier.levierId);
  if (potentielReduction === undefined) {
    return levier;
  }
  return { ...levier, potentielReduction };
};

export const toLeviersPriorisation = ({
  pertinences,
  mobilisation,
  potentiels,
}: {
  pertinences: PertinenceLevier[];
  mobilisation: Mobilisation;
  potentiels: PotentielsReduction;
}): LevierPriorisation[] => {
  const scoreByLevier = toMobilisationScoreByLevier(mobilisation);
  return toLevierCards({ pertinences, mobilisation }).map((card) =>
    withPotentiel(
      { ...card, mobilisationScore: scoreByLevier.get(card.levierId) ?? 0 },
      potentiels
    )
  );
};
