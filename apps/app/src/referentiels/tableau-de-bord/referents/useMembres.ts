import { useQuery } from '@tanstack/react-query';
import { RouterInput, RouterOutput, useTRPC } from '@tet/api';
import { groupBy } from 'es-toolkit';

type ListMembresInput = RouterInput['collectivites']['membres']['list'];
export type CollectiviteMembre =
  RouterOutput['collectivites']['membres']['list'][number];

/**
 * Charge la liste des membres de la collectivité
 */
export const useMembres = (input: ListMembresInput) => {
  const trpc = useTRPC();
  return useQuery(trpc.collectivites.membres.list.queryOptions(input));
};

/** Groupe les membres par fonction */
export const groupeParFonction = (membres: CollectiviteMembre[]) =>
  membres?.length
    ? groupBy(membres, (membre) => membre.fonction || 'non_renseigne')
    : undefined;
