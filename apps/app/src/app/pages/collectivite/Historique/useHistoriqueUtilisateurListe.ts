import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';

/**
 * Les utilisateurs ayant effectué une modification sur la collectivité
 */
export const useHistoriqueUtilisateurListe = (collectiviteId: number) => {
  const trpc = useTRPC();
  const { data } = useQuery(
    trpc.referentiels.historique.listUtilisateurs.queryOptions({
      collectiviteId,
    })
  );
  return data;
};
