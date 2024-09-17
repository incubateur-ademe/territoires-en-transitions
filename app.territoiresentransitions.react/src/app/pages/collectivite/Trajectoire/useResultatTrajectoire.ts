import {useQuery} from 'react-query';
import {useApiClient} from 'core-logic/api/useApiClient';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {DATE_FIN, IndicateurTrajectoire, SourceIndicateur} from './constants';
import {
  getKey,
  IndicateurAvecValeurs,
  ResultatTrajectoire,
} from './useCalculTrajectoire';
import {
  IndicateurValeurGroupee,
  separeObjectifsEtResultats,
  useIndicateurValeurs,
} from './useIndicateurValeurs';

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
  /** coefficient pour normaliser les données */
  coef?: number;
}) => {
  // données de la trajectoire
  const {data, isLoading: isLoadingTrajectoire} = useTrajectoire();
  const trajectoire = data && data.trajectoire?.[indicateur.id];

  // crée les datasets par secteur pour le graphique
  const valeursTousSecteurs =
    trajectoire &&
    indicateur.secteurs &&
    prepareDonneesParSecteur(indicateur.secteurs, trajectoire, coef);

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
    prepareDonneesParSecteur(secteur.sousSecteurs, trajectoire, coef);

  // dataset du secteur sélectionné
  const valeursSecteur =
    valeursTousSecteurs && secteurIdx > 0
      ? valeursTousSecteurs.find(s => s?.id === identifiant)
      : null;

  // charge les données objectifs/résultats de la collectivité et open data
  const {data: indicateursEtValeurs, isLoading: isLoadingObjectifsResultats} =
    useIndicateurValeurs({
      identifiants_referentiel: [identifiant],
      date_fin: DATE_FIN,
      sources: [
        SourceIndicateur.COLLECTIVITE,
        SourceIndicateur.RARE,
        SourceIndicateur.PCAET,
      ],
    });

  const sources = indicateursEtValeurs?.indicateurs?.[0]?.sources;
  const objectifsEtResultats = separeObjectifsEtResultats(
    sources?.[SourceIndicateur.COLLECTIVITE]?.valeurs
  );
  const objectifsPCAET = separeObjectifsEtResultats(
    sources?.[SourceIndicateur.PCAET]?.valeurs
  )?.objectifs;
  const resultatsRARE = separeObjectifsEtResultats(
    sources?.[SourceIndicateur.RARE]?.valeurs
  )?.resultats;

  const objectifsCollectiviteOuPCAET = selectDataset({
    donneesCollectivites: objectifsEtResultats?.objectifs,
    donneesSourceExterne: objectifsPCAET,
  });
  const resultatsCollectiviteOuRARE = selectDataset({
    donneesCollectivites: objectifsEtResultats?.resultats,
    donneesSourceExterne: resultatsRARE,
  });

  // crée les datasets objectifs et résultats pour le graphique
  const objectifs =
    objectifsCollectiviteOuPCAET?.map(v => ({
      x: new Date(v.date_valeur),
      y: (v.objectif as number) * (coef || 1),
    })) || [];
  const resultats =
    resultatsCollectiviteOuRARE?.map(v => ({
      x: new Date(v.date_valeur),
      y: (v.resultat as number) * (coef || 1),
    })) || [];

  // détermine si les données d'entrée sont dispos pour tous les secteurs
  const donneesSectoriellesIncompletes =
    (data &&
      !!data?.indentifiants_referentiel_manquants_donnees_entree?.length) ||
    false;

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
  indicateurs: IndicateurAvecValeurs[],
  /** coefficient pour normaliser les données */
  coef?: number
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
              y: v.objectif * (coef || 1),
            })),
          }
        : null;
    })
    .filter(v => !!v);
};

/** Sélectionne le jeu de données le plus approprié pour l'affichage des objectifs/résultats */
const selectDataset = ({
  donneesCollectivites,
  donneesSourceExterne,
}: {
  donneesCollectivites?: IndicateurValeurGroupee[];
  donneesSourceExterne?: IndicateurValeurGroupee[];
}) => {
  if (!donneesSourceExterne?.length) {
    return donneesCollectivites;
  }
  if ((donneesCollectivites?.length ?? 0) <= 1) {
    return donneesSourceExterne;
  }
  return donneesCollectivites;
};
