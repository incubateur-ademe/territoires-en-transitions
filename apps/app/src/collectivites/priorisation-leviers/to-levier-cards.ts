import { RouterOutput } from '@tet/api';
import {
  toPertinencesByLevier,
  LevierPertinences,
  Pertinence,
  PertinenceLevier,
  PertinenceVoletEffective,
  resolvePertinenceVolet,
} from '@tet/domain/collectivites';
import {
  CategorieAction,
  categorieActionEnumValues,
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

type VoletMobilisation = LevierMobilisation['volets'][number];

export type LevierCategorie = {
  categorie: CategorieAction;
  ficheCount: number;
  pertinenceEffective: PertinenceVoletEffective;
};

export type LevierCard = {
  levierId: LevierId;
  nom: Levier;
  secteur: LevierSecteur;
  ficheCount: number;
  categories: LevierCategorie[];
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

const toLevierCategorie = ({
  categorie,
  volets,
  levierPertinences,
}: {
  categorie: CategorieAction;
  volets: VoletMobilisation[];
  levierPertinences?: LevierPertinences;
}): LevierCategorie => {
  const ficheCount =
    volets.find((volet) => volet.categorie === categorie)?.ficheCount ?? 0;
  return {
    categorie,
    ficheCount,
    pertinenceEffective: resolvePertinenceVolet({
      isMobilise: ficheCount > 0,
      levierPertinence: levierPertinences?.levier,
      voletPertinence: levierPertinences?.categories.get(categorie),
    }),
  };
};

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
  const levierPertinences = pertinencesByLevier.get(levierId);
  const card = {
    levierId,
    nom,
    secteur: LEVIER_SECTEURS[nom],
    ficheCount: levierMobilisation?.ficheCount ?? 0,
    categories: categorieActionEnumValues.map((categorie) =>
      toLevierCategorie({
        categorie,
        volets: levierMobilisation?.volets ?? [],
        levierPertinences,
      })
    ),
  };
  const pertinence = levierPertinences?.levier;

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
