import { RouterOutput } from '@tet/api';
import {
  LevierPertinences,
  Pertinence,
  PertinenceLevier,
  toPertinencesByLevier,
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

type LevierMobilisation = Mobilisation['leviers'][number];

export type LevierCard = {
  levierId: LevierId;
  nom: Levier;
  secteur: LevierSecteur;
  ficheCount: number;
  pertinence?: Pertinence;
};

export const hasMobilisation = (mobilisation: Mobilisation): boolean =>
  mobilisation.leviers.some(({ ficheCount }) => ficheCount > 0);

const toMobilisationByLevier = (
  mobilisation: Mobilisation
): Map<LevierId, LevierMobilisation> =>
  new Map(
    mobilisation.leviers.map((levierMobilisation) => [
      levierMobilisation.levierId,
      levierMobilisation,
    ])
  );

const toLevierCard = ({
  levierId,
  pertinencesByLevier,
  mobilisationByLevier,
}: {
  levierId: LevierId;
  pertinencesByLevier: Map<LevierId, LevierPertinences>;
  mobilisationByLevier: Map<LevierId, LevierMobilisation>;
}): LevierCard => {
  const nom = LEVIER_NOM_BY_ID[levierId];
  const levierMobilisation = mobilisationByLevier.get(levierId);
  const card = {
    levierId,
    nom,
    secteur: LEVIER_SECTEURS[nom],
    ficheCount: levierMobilisation?.ficheCount ?? 0,
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
  const pertinencesByLevier = toPertinencesByLevier(pertinences);
  const mobilisationByLevier = toMobilisationByLevier(mobilisation);
  return levierIdEnumValues.map((levierId) =>
    toLevierCard({ levierId, pertinencesByLevier, mobilisationByLevier })
  );
};
