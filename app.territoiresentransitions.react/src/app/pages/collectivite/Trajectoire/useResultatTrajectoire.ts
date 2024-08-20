import {useQuery} from 'react-query';
import {useApiClient} from 'core-logic/api/useApiClient';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {useIndicateurReferentielValeurs} from 'app/pages/collectivite/Indicateurs/useIndicateurValeurs';
import {IndicateurTrajectoire} from './constants';
import {getKey, ResultatTrajectoire} from './useCalculTrajectoire';

/** Charge la trajectoire */
const useTrajectoire = () => {
  const collectiviteId = useCollectiviteId();
  const api = useApiClient();

  return useQuery(
    getKey(collectiviteId),
    async () =>
      collectiviteId &&
      api.get<ResultatTrajectoire>({
        route: '/trajectoires/snbc',
        params: {collectivite_id: collectiviteId},
      }),
    {
      retry: false,
      refetchOnMount: false,
    }
  );
};

/**
 * Charge et transforme les données de la trajectoire d'un indicateur donné
 * pour pouvoir tracer les graphiques.
 */
export const useResultatTrajectoire = ({
  indicateur,
  secteurIdx,
}: {
  indicateur: IndicateurTrajectoire;
  secteurIdx: number;
}) => {
  // données de la trajectoire
  const {data, isLoading: isLoadingTrajectoire} = useTrajectoire();
  const trajectoire = data && data.trajectoire?.[indicateur.id];

  // crée les datasets par secteur pour le graphique
  const valeursTousSecteurs =
    trajectoire &&
    indicateur.secteurs
      .map(s => {
        const valeurs = trajectoire.find(
          t => t.definition.identifiant_referentiel === s.identifiant
        )?.valeurs;
        return valeurs
          ? {
              id: s.nom,
              data: valeurs.map(v => ({
                x: new Date(v.date_valeur).getFullYear(),
                y: v.objectif,
              })),
            }
          : null;
      })
      .filter(v => !!v);

  // identifiant référentiel de l'indicateur associé pour lequel il faut charger
  // les objectifs/résultats saisis par la collectivité
  const identifiant =
    secteurIdx === 0
      ? indicateur.identifiant
      : indicateur.secteurs[secteurIdx - 1].identifiant;

  // charge les données objectifs/résultats
  const {data: objectifsEtResults, isLoading: isLoadingObjectifsResultats} =
    useIndicateurReferentielValeurs({
      identifiant,
    });

  // crée les datasets objectifs et résultats pour le graphique
  const objectifs =
    objectifsEtResults
      ?.filter(v => typeof v.objectif === 'number')
      .map(v => ({x: v.annee, y: v.objectif})) || [];
  const resultats =
    objectifsEtResults
      ?.filter(v => typeof v.resultat === 'number')
      .map(v => ({x: v.annee, y: v.resultat})) || [];

  return {
    identifiant,
    objectifs,
    resultats,
    valeursTousSecteurs,
    isLoadingObjectifsResultats,
    isLoadingTrajectoire,
  };
};
