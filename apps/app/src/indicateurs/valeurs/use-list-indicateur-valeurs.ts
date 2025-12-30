import { useQuery } from '@tanstack/react-query';
import { RouterInput, RouterOutput, useTRPC } from '@tet/api';
import { useCollectiviteId } from '@tet/api/collectivites';

export type IndicateurValeurGroupee = {
  id: number;
  dateValeur: string;
  resultat?: number | null;
  resultatCommentaire?: string | null;
  objectif?: number | null;
  objectifCommentaire?: string | null;
  metadonneeId?: number | null;
};

export type ListIndicateurValeurOuput =
  RouterOutput['indicateurs']['valeurs']['list'];

type ListInput = Omit<
  RouterInput['indicateurs']['valeurs']['list'],
  'collectiviteId'
> & {
  collectiviteId?: number;
};

/** Charge toutes les valeurs associées à un indicateur id (ou à un ou plusieurs identifiants d'indicateurs prédéfinis) */
export const useListIndicateurValeurs = (
  input: ListInput,
  { enabled }: { enabled: boolean } = { enabled: true }
) => {
  const collectiviteId = useCollectiviteId();
  const trpc = useTRPC();

  return useQuery(
    trpc.indicateurs.valeurs.list.queryOptions(
      {
        ...input,
        collectiviteId: input.collectiviteId ?? collectiviteId,
      },
      {
        enabled,
      }
    )
  );
};

/** Utilitaire pour séparer les valeurs objectifs et résultats */
export const separeObjectifsEtResultats = (
  valeurs: IndicateurValeurGroupee[] | undefined
) =>
  valeurs?.reduce(
    (objectifsEtResultats, valeur) => {
      const { objectif, resultat } = valeur;
      if (objectif !== undefined) {
        objectifsEtResultats.objectifs.push(valeur);
      }
      if (resultat !== undefined) {
        objectifsEtResultats.resultats.push(valeur);
      }
      return objectifsEtResultats;
    },
    {
      objectifs: [] as IndicateurValeurGroupee[],
      resultats: [] as IndicateurValeurGroupee[],
    }
  );
