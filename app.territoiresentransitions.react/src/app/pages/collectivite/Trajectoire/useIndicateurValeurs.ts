import {useQuery} from 'react-query';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {useApiClient} from 'core-logic/api/useApiClient';
import {Indicateurs, Tables} from '@tet/api';

type GetIndicateurValeursRequest = {
  identifiants_referentiel?: string[];
  indicateur_id?: number;
  date_debut?: string;
  date_fin?: string;
  sources?: string[];
  ignore_dedoublonnage?: boolean;
};

type GetIndicateursValeursResponse = {
  indicateurs: IndicateurAvecValeursParSource[];
};

type IndicateurAvecValeursParSource = {
  definition: Omit<
    Indicateurs.domain.IndicateurDefinitionPredefini,
    'identifiant'
  > & {identifiant_referentiel: string};
  sources: Record<string, IndicateurValeursGroupeeParSource>;
};

type IndicateurValeursGroupeeParSource = {
  source: string;
  metadonnees: Tables<'indicateur_source_metadonnee'>[];
  valeurs: IndicateurValeurGroupee[];
};

type IndicateurValeurGroupee = {
  id: number;
  date_valeur: string;
  resultat?: number | null;
  resultat_commentaire?: string | null;
  objectif?: number | null;
  objectif_commentaire?: string | null;
  metadonnee_id?: number | null;
};

export enum SourceIndicateur {
  COLLECTIVITE = 'collectivite',
  RARE = 'rare',
  PCAET = 'pcaet',
}

/** Charge toutes les valeurs associées à un indicateur id (ou à un ou plusieurs identifiants d'indicateurs prédéfinis) */
export const useIndicateurValeurs = (params: GetIndicateurValeursRequest) => {
  const collectivite_id = useCollectiviteId();
  const api = useApiClient();

  return useQuery(['indicateur_valeurs', collectivite_id, params], async () => {
    if (!collectivite_id) return;
    return api.get<GetIndicateursValeursResponse>({
      route: '/indicateurs',
      params: {collectivite_id, ...params},
    });
  });
};

/** Utilitaire pour séparer les valeurs objectifs et résultats */
export const separeObjectifsEtResultats = (
  valeurs: IndicateurValeurGroupee[] | undefined
) =>
  valeurs?.reduce(
    (objectifsEtResultats, valeur) => {
      const {objectif, resultat} = valeur;
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
