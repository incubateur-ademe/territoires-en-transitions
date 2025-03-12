import { RouterInput, RouterOutput, trpc } from '@/api/utils/trpc/client';

type IndicateurReferenceInput =
  RouterInput['indicateurs']['valeurs']['reference'];
export type IndicateurReferenceOutput =
  RouterOutput['indicateurs']['valeurs']['reference'];

export const useIndicateurReference = (input: IndicateurReferenceInput) => {
  return trpc.indicateurs.valeurs.reference.useQuery(input);
};

export const hasValeurCible = (valeursReference?: IndicateurReferenceOutput) =>
  Boolean(
    valeursReference &&
      (valeursReference.cible !== null || valeursReference.objectifs?.length)
  );

export const hasValeurSeuil = (valeursReference?: IndicateurReferenceOutput) =>
  Boolean(valeursReference && valeursReference.seuil !== null);
