import {useQuery} from 'react-query';
import {useApiClient} from 'core-logic/api/useApiClient';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {useIndicateurReferentielValeurs} from 'app/pages/collectivite/Indicateurs/useIndicateurValeurs';
import {IndicateurTrajectoire} from './constants';
import {
  getKey,
  IndicateurAvecValeurs,
  ResultatTrajectoire,
} from './useCalculTrajectoire';

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
  coef,
}: {
  /** indicateur trajectoire */
  indicateur: IndicateurTrajectoire;
  /** index du secteur sélectionné */
  secteurIdx: number;
  /** coefficient pour normaliser les données objectifs/résultats */
  coef?: number;
}) => {
  // données de la trajectoire
  const {data, isLoading: isLoadingTrajectoire} = useTrajectoire();
  const trajectoire = data && data.trajectoire?.[indicateur.id];

  // crée les datasets par secteur pour le graphique
  const valeursTousSecteurs =
    trajectoire &&
    indicateur.secteurs &&
    prepareDonneesParSecteur(indicateur.secteurs, trajectoire);

  // secteur sélectionné
  const secteur = secteurIdx === 0 ? null : indicateur.secteurs[secteurIdx - 1];

  // identifiant référentiel de l'indicateur associé pour lequel il faut charger
  // les objectifs/résultats saisis par la collectivité
  const identifiant = secteur ? secteur.identifiant : indicateur.identifiant;

  // crée les datasets par sous-secteur si un secteur est sélectionné
  const valeursSousSecteurs =
    trajectoire &&
    secteur &&
    'sousSecteurs' in secteur &&
    prepareDonneesParSecteur(secteur.sousSecteurs, trajectoire);

  // dataset du secteur sélectionné
  const valeursSecteur =
    valeursTousSecteurs && secteurIdx > 0
      ? valeursTousSecteurs.find(s => s?.id === identifiant)
      : null;

  // charge les données objectifs/résultats
  const {data: objectifsEtResults, isLoading: isLoadingObjectifsResultats} =
    useIndicateurReferentielValeurs({
      identifiant,
    });

  // crée les datasets objectifs et résultats pour le graphique
  const objectifs =
    objectifsEtResults
      ?.filter(v => typeof v.objectif === 'number')
      .map(v => ({
        x: new Date(`${v.annee}-01-01`),
        y: (v.objectif as number) * (coef || 1),
      })) || [];
  const resultats =
    objectifsEtResults
      ?.filter(v => typeof v.resultat === 'number')
      .map(v => ({
        x: new Date(`${v.annee}-01-01`),
        y: (v.resultat as number) * (coef || 1),
      })) || [];

  // détermine si les données sont dispos pour tous les secteurs
  const donneesSectoriellesIncompletes =
    !Array.isArray(valeursTousSecteurs) ||
    valeursTousSecteurs.length < indicateur.secteurs.length;

  return {
    identifiant,
    objectifs,
    resultats,
    valeursTousSecteurs,
    valeursSecteur,
    valeursSousSecteurs,
    donneesSectoriellesIncompletes,
    isLoadingObjectifsResultats,
    isLoadingTrajectoire,
  };
};

// crée les datasets par secteur pour le graphique
const prepareDonneesParSecteur = (
  /** (sous-)secteurs à inclure */
  secteurs: Readonly<Array<{nom: string; identifiant: string}>>,
  /** données de la trajectoire */
  indicateurs: IndicateurAvecValeurs[]
) => {
  if (!indicateurs?.length || !secteurs?.length) return undefined;

  return secteurs
    .map(s => {
      const valeurs = indicateurs.find(
        t => t.definition.identifiant_referentiel === s.identifiant
      )?.valeurs;
      return valeurs
        ? {
            id: s.identifiant,
            label: s.nom,
            data: valeurs.map(v => ({
              x: new Date(v.date_valeur),
              y: v.objectif,
            })),
          }
        : null;
    })
    .filter(v => !!v);
};