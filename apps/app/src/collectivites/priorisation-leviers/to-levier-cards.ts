import { RouterOutput } from '@tet/api';
import {
  indexPertinences,
  LevierPertinences,
  Pertinence,
  PertinenceLevier,
} from '@tet/domain/collectivites';
import {
  Levier,
  LEVIER_NOM_BY_ID,
  LEVIER_SECTEURS,
  LevierId,
  levierIdEnumValues,
  LevierSecteur,
} from '@tet/domain/shared';

export type Mobilisation =
  RouterOutput['collectivites']['analysis']['getMobilisation'];

export type LevierCard = {
  levierId: LevierId;
  nom: Levier;
  secteur: LevierSecteur;
  ficheCount: number;
  pertinence?: Pertinence;
};

export const hasMobilisation = (mobilisation: Mobilisation): boolean =>
  mobilisation.leviers.some(({ ficheCount }) => ficheCount > 0);

const indexFicheCounts = (mobilisation: Mobilisation): Map<LevierId, number> =>
  new Map(
    mobilisation.leviers.map(({ levierId, ficheCount }) => [
      levierId,
      ficheCount,
    ])
  );

const toLevierCard = ({
  levierId,
  pertinencesByLevier,
  ficheCountsByLevier,
}: {
  levierId: LevierId;
  pertinencesByLevier: Map<LevierId, LevierPertinences>;
  ficheCountsByLevier: Map<LevierId, number>;
}): LevierCard => {
  const nom = LEVIER_NOM_BY_ID[levierId];
  const card = {
    levierId,
    nom,
    secteur: LEVIER_SECTEURS[nom],
    ficheCount: ficheCountsByLevier.get(levierId) ?? 0,
  };
  const pertinence = pertinencesByLevier.get(levierId)?.levier;

  if (pertinence === undefined) {
    return card;
  }
  return { ...card, pertinence };
};

export const toLevierCards = ({
  pertinences,
  mobilisation,
}: {
  pertinences: PertinenceLevier[];
  mobilisation: Mobilisation;
}): LevierCard[] => {
  const pertinencesByLevier = indexPertinences(pertinences);
  const ficheCountsByLevier = indexFicheCounts(mobilisation);
  return levierIdEnumValues.map((levierId) =>
    toLevierCard({ levierId, pertinencesByLevier, ficheCountsByLevier })
  );
};
