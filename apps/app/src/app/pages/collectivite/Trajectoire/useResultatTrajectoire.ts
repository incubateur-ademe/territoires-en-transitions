import { COULEURS_SECTEUR, LAYERS } from '@/app/ui/charts/echarts/constants';
import { IndicateurAvecValeurs } from '@/domain/indicateurs';
import {
  DATE_FIN,
  EMISSIONS_NETTES,
  IndicateurTrajectoire,
  SourceIndicateur,
  getNomSource,
} from './constants';
import { useGetTrajectoire } from './useCalculTrajectoire';
import {
  IndicateurValeurGroupee,
  separeObjectifsEtResultats,
  useIndicateurValeurs,
} from './useIndicateurValeurs';

/**
 * Charge et transforme les données de la trajectoire d'un indicateur donné
 * pour pouvoir tracer les graphiques.
 */
export const useResultatTrajectoire = ({
  indicateur,
  secteurIdx,
}: {
  /** indicateur trajectoire */
  indicateur: IndicateurTrajectoire;
  /** index du secteur sélectionné */
  secteurIdx: number;
}) => {
  // données de la trajectoire
  const { data, isLoading: isLoadingTrajectoire } = useGetTrajectoire();
  const trajectoire =
    data?.trajectoire && Object.values(data.trajectoire).flat();

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

  // dataset du secteur sélectionné
  const valeursSecteur =
    valeursTousSecteurs && secteurIdx > 0
      ? valeursTousSecteurs.find((s) => s?.id === identifiant)
      : null;

  // crée les datasets par sous-secteur si un secteur est sélectionné
  const valeursSousSecteurs =
    trajectoire &&
    secteur &&
    'sousSecteurs' in secteur &&
    prepareDonneesParSecteur(secteur.sousSecteurs, trajectoire);

  // charge les données objectifs/résultats de la collectivité et open data
  const { data: indicateursEtValeurs, isLoading: isLoadingObjectifsResultats } =
    useIndicateurValeurs({
      identifiantsReferentiel: [identifiant],
      dateFin: DATE_FIN,
      sources: [
        SourceIndicateur.COLLECTIVITE,
        SourceIndicateur.RARE,
        SourceIndicateur.PCAET,
      ],
    });

  // sépare les valeurs objectif & résultat
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

  // sélectionne le jeu de données approprié et détermine la source utilisée
  const {
    donnees: objectifsCollectiviteOuPCAET,
    source: sourceObjectifsUtilisee,
  } = selectDatasetWithSource({
    donneesCollectivites: objectifsEtResultats?.objectifs,
    sourcesExternes: [
      { donnees: objectifsPCAET, source: SourceIndicateur.PCAET },
    ],
  });

  const {
    donnees: resultatsCollectiviteOuRARE,
    source: sourceResultatsUtilisee,
  } = selectDatasetWithSource({
    donneesCollectivites: objectifsEtResultats?.resultats,
    sourcesExternes: [
      { donnees: resultatsRARE, source: SourceIndicateur.RARE },
    ],
  });

  // crée les datasets objectifs et résultats pour le graphique
  const objectifs = {
    id: 'objectifs',
    name: getLabel('objectifs', sourceObjectifsUtilisee),
    color: LAYERS.objectifs.color,
    source:
      objectifsCollectiviteOuPCAET?.map((v) => ({
        x: v.dateValeur,
        y: v.objectif as number,
      })) || [],
  };
  const resultats = {
    id: 'resultats',
    name: getLabel('resultats', sourceResultatsUtilisee),
    color: LAYERS.resultats.color,
    source:
      resultatsCollectiviteOuRARE?.map((v) => ({
        x: v.dateValeur,
        y: v.resultat as number,
      })) || [],
  };

  // détermine si les données d'entrée sont dispos pour tous les secteurs
  const donneesSectoriellesIncompletes =
    (data && !!data?.indentifiantsReferentielManquantsDonneesEntree?.length) ||
    false;

  // extrait les données des émissions nettes pour le graphe tous secteurs
  const dataEmissionsNettes =
    indicateur.id === 'emissions_ges' &&
    !secteur &&
    trajectoire?.find(
      (t) => t.definition.identifiantReferentiel === EMISSIONS_NETTES.id
    );
  const emissionsNettes = dataEmissionsNettes
    ? {
        id: EMISSIONS_NETTES.id,
        name: EMISSIONS_NETTES.nom,
        color: LAYERS.trajectoire.color,
        source: dataEmissionsNettes.valeurs.map((v) => ({
          x: v.dateValeur,
          y: v.objectif,
        })),
      }
    : null;

  return {
    emissionsNettes,
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
  secteurs: Readonly<Array<{ nom: string; identifiant: string }>>,
  /** données de la trajectoire */
  indicateurs: IndicateurAvecValeurs[]
) => {
  if (!indicateurs?.length || !secteurs?.length) return undefined;

  return secteurs
    .map((s, i) => {
      const valeurs = indicateurs.find(
        (t) => t.definition.identifiantReferentiel === s.identifiant
      )?.valeurs;
      return valeurs
        ? {
            id: s.identifiant,
            name: s.nom,
            source: valeurs.map((v) => ({
              x: v.dateValeur,
              y: v.objectif,
            })),
            dimensions: ['x', 'y'],
            color: COULEURS_SECTEUR[i % COULEURS_SECTEUR.length],
          }
        : null;
    })
    .filter((v) => !!v);
};

// sélectionne le jeu de données le plus approprié  pour l'affichage des objectifs/résultats
// et détermine la source utilisée
const selectDatasetWithSource = ({
  donneesCollectivites,
  sourcesExternes,
}: {
  donneesCollectivites?: IndicateurValeurGroupee[];
  sourcesExternes: Array<{
    donnees?: IndicateurValeurGroupee[];
    source: SourceIndicateur;
  }>;
}): {
  donnees?: IndicateurValeurGroupee[];
  source: SourceIndicateur;
} => {
  const sourceExterneAvecDonnees = sourcesExternes.find(
    (s) => s.donnees?.length
  );

  if (sourceExterneAvecDonnees && (donneesCollectivites?.length ?? 0) <= 1) {
    return {
      donnees: sourceExterneAvecDonnees.donnees,
      source: sourceExterneAvecDonnees.source,
    };
  }

  return {
    donnees: donneesCollectivites,
    source: SourceIndicateur.COLLECTIVITE,
  };
};

const getLabel = (
  type: 'objectifs' | 'resultats',
  source: SourceIndicateur
): string => {
  const typeLabel = type === 'objectifs' ? 'Objectifs' : 'Résultats';
  const sourceLabel =
    source === SourceIndicateur.COLLECTIVITE
      ? 'de la collectivité'
      : getNomSource(source);
  return `${typeLabel} ${sourceLabel}`;
};
