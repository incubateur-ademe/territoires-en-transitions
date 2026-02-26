import { useQuery } from '@tanstack/react-query';
import { RouterInput, useTRPC } from '@tet/api';
import { MembreFonction } from '@tet/domain/collectivites';
import { groupBy } from 'es-toolkit';

type ListMembresInput = RouterInput['collectivites']['membres']['list'];

/**
 * Charge la liste des membres de la collectivité
 */
export const useMembres = (input: ListMembresInput) => {
  const trpc = useTRPC();
  return useQuery(trpc.collectivites.membres.list.queryOptions(input));
};

/** Groupe les membres par fonction */
export const groupeParFonction = <
  T extends { fonction: MembreFonction | null }
>(
  membres: T[]
) =>
  membres?.length
    ? groupBy(membres, (membre) => membre.fonction || 'non_renseigne')
    : undefined;
