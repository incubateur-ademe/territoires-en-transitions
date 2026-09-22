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

export type LevierCard = {
  levierId: LevierId;
  nom: Levier;
  secteur: LevierSecteur;
  pertinence?: Pertinence;
};

const toLevierCard = (
  levierId: LevierId,
  pertinencesByLevier: Map<LevierId, LevierPertinences>
): LevierCard => {
  const nom = LEVIER_NOM_BY_ID[levierId];
  const card = { levierId, nom, secteur: LEVIER_SECTEURS[nom] };
  const pertinence = pertinencesByLevier.get(levierId)?.levier;

  if (pertinence === undefined) {
    return card;
  }
  return { ...card, pertinence };
};

export const toLevierCards = ({
  pertinences,
}: {
  pertinences: PertinenceLevier[];
}): LevierCard[] => {
  const pertinencesByLevier = indexPertinences(pertinences);
  return levierIdEnumValues.map((levierId) =>
    toLevierCard(levierId, pertinencesByLevier)
  );
};
