import { RouterInput, RouterOutput, trpc } from '@/api/utils/trpc/client';

type IndicateurReferenceInput =
  RouterInput['indicateurs']['valeurs']['reference'];
export type IndicateurReferenceOutput =
  RouterOutput['indicateurs']['valeurs']['reference'][number];

export const useIndicateursListReferences = (
  input: IndicateurReferenceInput
) => {
  return trpc.indicateurs.valeurs.reference.useQuery(input);
};

export const useIndicateurReference = ({
  collectiviteId,
  indicateurId,
}: {
  collectiviteId: number;
  indicateurId: number;
}) => {
  const { data, ...other } = useIndicateursListReferences({
    collectiviteId,
    indicateurIds: [indicateurId],
  });
  return { data: data?.[0], ...other };
};

export const hasValeurCible = (valeursReference?: IndicateurReferenceOutput) =>
  Boolean(
    valeursReference &&
      (valeursReference.cible !== null || valeursReference.objectifs?.length)
  );

export const hasValeurSeuil = (valeursReference?: IndicateurReferenceOutput) =>
  Boolean(valeursReference && valeursReference.seuil !== null);
