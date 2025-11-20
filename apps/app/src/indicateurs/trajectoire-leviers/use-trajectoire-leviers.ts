import {
  COULEURS_BY_SECTEUR_IDENTIFIANT,
  EXTRA_SECTEUR_COLORS,
} from '@/app/indicateurs/trajectoires/trajectoire-colors';
import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { useCurrentCollectivite } from '@tet/api/collectivites';

/** Charge les leviers de la trajectoire */
export const useTrajectoireLeviers = () => {
  const { collectiviteId } = useCurrentCollectivite();
  const trpc = useTRPC();

  return useQuery(
    trpc.indicateurs.trajectoires.leviers.getData.queryOptions(
      {
        collectiviteId,
      },
      {
        refetchOnMount: false,
        select: (data) => {
          return {
            ...data,
            secteurs: data.secteurs.map((secteur, index) => ({
              ...secteur,
              couleur:
                secteur.identifiants
                  .map(
                    (identifiant) =>
                      COULEURS_BY_SECTEUR_IDENTIFIANT[identifiant]
                  )
                  .find((couleur) => couleur) ||
                EXTRA_SECTEUR_COLORS[index % EXTRA_SECTEUR_COLORS.length],
            })),
          };
        },
      }
    )
  );
};
