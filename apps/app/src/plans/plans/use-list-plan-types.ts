import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { OptionSection } from '@tet/ui';

/** Renvoie la liste complète des types possibles de plan */
export const useListPlanTypes = () => {
  const trpc = useTRPC();
  const { data = [], isLoading } = useQuery(
    trpc.plans.plans.listTypes.queryOptions()
  );

  /** Formate la liste pour créer des options avec section */
  const options = data.reduce((acc: OptionSection[], curr) => {
    /** Ajout des sections */
    if (!acc.some((v) => v.title === curr.categorie)) {
      acc.push({
        title: curr.categorie,
        options: [
          {
            value: curr.id,
            label: `${curr.type}${curr.detail ? ` (${curr.detail})` : ''}`,
          },
        ],
      });
    } else {
      /** Ajout des options dans les sections */
      acc[acc.findIndex((v) => v.title === curr.categorie)].options.push({
        value: curr.id,
        label: `${curr.type}${curr.detail ? ` (${curr.detail})` : ''}`,
      });
    }
    return acc;
  }, []);

  return { data, options, isLoading };
};
