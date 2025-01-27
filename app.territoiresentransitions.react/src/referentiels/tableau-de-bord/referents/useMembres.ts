import { RouterInput, RouterOutput, trpc } from '@/api/utils/trpc/client';
import { groupBy } from 'es-toolkit';

type ListMembresInput = RouterInput['collectivites']['membres']['list'];
export type CollectiviteMembre =
  RouterOutput['collectivites']['membres']['list'][number];

/**
 * Charge la liste des membres de la collectivité
 */
export const useMembres = (input: ListMembresInput) =>
  trpc.collectivites.membres.list.useQuery(input);

/** Groupe les membres par fonction */
export const groupeParFonction = (membres: CollectiviteMembre[]) =>
  membres?.length
    ? groupBy(membres, (membre) => membre.fonction || 'non_renseigne')
    : undefined;
