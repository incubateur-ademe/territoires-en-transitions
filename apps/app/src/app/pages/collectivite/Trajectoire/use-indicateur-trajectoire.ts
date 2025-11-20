import {
  COULEURS_BY_SECTEUR_IDENTIFIANT,
  EXTRA_SECTEUR_COLORS,
} from '@/app/indicateurs/trajectoires/trajectoire-colors';
import {
  DATE_FIN_SNBC_V2,
  EMISSIONS_NETTES,
  IndicateurAvecValeurs,
  IndicateurSourceEnum,
} from '@tet/domain/indicateurs';
import {
  IndicateurTrajectoire,
  getNomSource,
} from '../../../../indicateurs/trajectoires/trajectoire-constants';
import {
  IndicateurValeurGroupee,
  separeObjectifsEtResultats,
  useListIndicateurValeurs,
} from '../../../../indicateurs/valeurs/use-list-indicateur-valeurs';
import { LAYERS } from './graphes/layer-parameters';
import { useGetTrajectoire } from './use-trajectoire';

/**
 * Charge et transforme les données de la trajectoire d'un indicateur donné
 * pour pouvoir tracer les graphiques.
 */
export const useIndicateurTrajectoire = ({
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
    prepareDonneesParSecteur(secteur.sousSecteurs || [], trajectoire);

  // charge les données objectifs/résultats de la collectivité et open data
  const { data: indicateursEtValeurs, isLoading: isLoadingObjectifsResultats } =
    useListIndicateurValeurs({
      identifiantsReferentiel: [identifiant],
      dateFin: DATE_FIN_SNBC_V2,
      sources: [
        IndicateurSourceEnum.COLLECTIVITE,
        IndicateurSourceEnum.RARE,
        IndicateurSourceEnum.PCAET,
      ],
    });
  // sépare les valeurs objectif & résultat
  const sources = indicateursEtValeurs?.indicateurs?.[0]?.sources;
  const objectifsEtResultats = separeObjectifsEtResultats(
    sources?.[IndicateurSourceEnum.COLLECTIVITE]?.valeurs
  );
  const objectifsPCAET = separeObjectifsEtResultats(
    sources?.[IndicateurSourceEnum.PCAET]?.valeurs
  )?.objectifs;
  const resultatsRARE = separeObjectifsEtResultats(
    sources?.[IndicateurSourceEnum.RARE]?.valeurs
  )?.resultats;

  // sélectionne le jeu de données approprié et détermine la source utilisée
  const {
    donnees: objectifsCollectiviteOuPCAET,
    source: sourceObjectifsUtilisee,
  } = selectDatasetWithSource({
    donneesCollectivites: objectifsEtResultats?.objectifs,
    sourcesExternes: [
      { donnees: objectifsPCAET, source: IndicateurSourceEnum.PCAET },
    ],
  });

  const {
    donnees: resultatsCollectiviteOuRARE,
    source: sourceResultatsUtilisee,
  } = selectDatasetWithSource({
    donneesCollectivites: objectifsEtResultats?.resultats,
    sourcesExternes: [
      { donnees: resultatsRARE, source: IndicateurSourceEnum.RARE },
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
    isLoadingObjectifsResultats,
    isLoadingTrajectoire,
  };
};

// crée les datasets par secteur pour le graphique
const prepareDonneesParSecteur = (
  /** (sous-)secteurs à inclure */
  secteurs: Array<{ nom: string; identifiant: string }>,
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
            color:
              COULEURS_BY_SECTEUR_IDENTIFIANT[s.identifiant] ||
              EXTRA_SECTEUR_COLORS[i % EXTRA_SECTEUR_COLORS.length],
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
    source: IndicateurSourceEnum;
  }>;
}): {
  donnees?: IndicateurValeurGroupee[];
  source: IndicateurSourceEnum;
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
    source: IndicateurSourceEnum.COLLECTIVITE,
  };
};

const getLabel = (
  type: 'objectifs' | 'resultats',
  source: IndicateurSourceEnum
): string => {
  const typeLabel = type === 'objectifs' ? 'Objectifs' : 'Résultats';
  const sourceLabel =
    source === IndicateurSourceEnum.COLLECTIVITE
      ? 'de la collectivité'
      : getNomSource(source);
  return `${typeLabel} ${sourceLabel}`;
};
