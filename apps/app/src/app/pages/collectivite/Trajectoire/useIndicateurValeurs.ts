import { Indicateurs, Tables } from '@/api';
import { useCollectiviteId } from '@/api/collectivites';
import { useApiClient } from '@/app/core-logic/api/useApiClient';
import { useQuery } from '@tanstack/react-query';

type GetIndicateurValeursRequest = {
  disabled?: boolean;
  identifiantsReferentiel?: string[];
  indicateurId?: number;
  dateDebut?: string;
  dateFin?: string;
  sources?: string[];
  ignoreDedoublonnage?: boolean;
};

type GetIndicateursValeursResponse = {
  indicateurs: IndicateurAvecValeursParSource[];
};

type IndicateurAvecValeursParSource = {
  definition: Omit<
    Indicateurs.domain.IndicateurDefinitionPredefini,
    'identifiant'
  > & { identifiantReferentiel: string };
  sources: Record<string, IndicateurValeursGroupeeParSource>;
};

type IndicateurValeursGroupeeParSource = {
  source: string;
  metadonnees: Tables<'indicateur_source_metadonnee'>[];
  valeurs: IndicateurValeurGroupee[];
};

export type IndicateurValeurGroupee = {
  id: number;
  dateValeur: string;
  resultat?: number | null;
  resultatCommentaire?: string | null;
  objectif?: number | null;
  objectifCommentaire?: string | null;
  metadonneeId?: number | null;
};

/** Charge toutes les valeurs associées à un indicateur id (ou à un ou plusieurs identifiants d'indicateurs prédéfinis) */
export const useIndicateurValeurs = ({
  disabled,
  ...params
}: GetIndicateurValeursRequest) => {
  const collectiviteId = useCollectiviteId();
  const api = useApiClient();

  return useQuery({
    queryKey: ['indicateur_valeurs', collectiviteId, params],

    queryFn: async () => {
      if (!collectiviteId || disabled) return;
      return api.get<GetIndicateursValeursResponse>({
        route: '/indicateurs',
        params: { collectiviteId, ...params },
      });
    },
  });
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
