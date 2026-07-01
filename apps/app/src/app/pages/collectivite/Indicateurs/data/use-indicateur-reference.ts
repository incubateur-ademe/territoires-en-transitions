import { useQuery } from '@tanstack/react-query';
import { RouterInput, RouterOutput, useTRPC } from '@tet/api';

type IndicateurReferenceInput =
  RouterInput['indicateurs']['valeurs']['reference'];
export type IndicateurReferenceOutput =
  RouterOutput['indicateurs']['valeurs']['reference'][number];

export const useIndicateursListReferences = (
  input: IndicateurReferenceInput,
  options?: { enabled?: boolean }
) => {
  const trpc = useTRPC();
  return useQuery(
    trpc.indicateurs.valeurs.reference.queryOptions(input, {
      enabled: options?.enabled,
    })
  );
};

export const useIndicateurReference = ({
  collectiviteId,
  indicateurId,
  enabled,
}: {
  collectiviteId: number;
  indicateurId: number;
  enabled?: boolean;
}) => {
  const { data, ...other } = useIndicateursListReferences(
    {
      collectiviteId,
      indicateurIds: [indicateurId],
    },
    { enabled }
  );
  return { data: data?.[0], ...other };
};

export const hasValeurCible = (valeursReference?: IndicateurReferenceOutput) =>
  Boolean(
    valeursReference &&
      (valeursReference.cible !== null || valeursReference.objectifs?.length)
  );

export const hasValeurSeuil = (valeursReference?: IndicateurReferenceOutput) =>
  Boolean(valeursReference && valeursReference.seuil !== null);
