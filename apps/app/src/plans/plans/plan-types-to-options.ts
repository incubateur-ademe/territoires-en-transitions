import { PlanType } from '@tet/domain/plans';
import { OptionSection } from '@tet/ui';
import { groupBy, partition } from 'es-toolkit';

const categorieDisplayOrder = ['Plans transverses', 'Plans thématiques'];

const categorieRank = (categorie: string): number => {
  const index = categorieDisplayOrder.indexOf(categorie);
  return index === -1 ? categorieDisplayOrder.length : index;
};

const isAutre = (planType: PlanType): boolean =>
  planType.type.startsWith('Autre');

const toOptionLabel = (planType: PlanType): string =>
  planType.detail ? `${planType.type} (${planType.detail})` : planType.type;

const toOptionSection = (
  categorie: string,
  planTypes: PlanType[]
): OptionSection => {
  const [autres, principaux] = partition(planTypes, isAutre);
  return {
    title: categorie,
    options: [...principaux, ...autres].map((planType) => ({
      value: planType.id,
      label: toOptionLabel(planType),
    })),
  };
};

export const planTypesToOptions = (planTypes: PlanType[]): OptionSection[] => {
  const byCategorie = groupBy(planTypes, (planType) => planType.categorie);
  return Object.keys(byCategorie)
    .sort((a, b) => categorieRank(a) - categorieRank(b))
    .map((categorie) => toOptionSection(categorie, byCategorie[categorie]));
};
