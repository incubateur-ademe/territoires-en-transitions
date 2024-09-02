import {
  ANNEE_REFERENCE,
  DATE_DEBUT,
  getIndicateurTrajectoire,
  getNomSource,
  SEQUESTRATION_CARBONE,
  IndicateurTrajectoireId,
  SourceIndicateur,
} from '../constants';
import {useIndicateurValeurs} from '../useIndicateurValeurs';
import {TabId} from './constants';

export type DonneesSectorisees = ReturnType<
  typeof useDonneesSectoriseesIndicateur
>;

type Source = {
  id: string;
  nom: string;
};

/** Charge les données
 *  sectorisées pour le dialogue "Lancer un calcul" */
export const useDonneesSectorisees = () => {
  // charge les données de chaque onglet
  const donneesSectorisees: Record<TabId, DonneesSectorisees> = {
    emissions_ges: useDonneesSectoriseesIndicateur('emissions_ges'),
    consommations_finales: useDonneesSectoriseesIndicateur(
      'consommations_finales'
    ),
    sequestration_carbone: useDonneesSectoriseesIndicateur(
      'sequestration_carbone'
    ),
  };

  // détemine si les données de la collectivité sont complètes
  // (permet de lancer un nouveau calcul ou non)
  const tabData = Object.values(donneesSectorisees);
  const donneesCompletes =
    tabData.filter(d => !d.isLoading && d.data.donneesCompletes).length ===
    tabData.length;

  return {
    donneesSectorisees,
    donneesCompletes,
  };
};

/** Charge les données sectorisées pour un onglet du dialogue "Lancer un calcul" */
const useDonneesSectoriseesIndicateur = (
  id: IndicateurTrajectoireId | typeof SEQUESTRATION_CARBONE.id
) => {
  const indicateurTrajectoire = getIndicateurTrajectoire(id);

  const identifiants = indicateurTrajectoire.secteurs.map(s => s.identifiant);
  const sourcesVoulues = indicateurTrajectoire.sources;

  const {data, ...rest} = useIndicateurValeurs({
    identifiants_referentiel: identifiants,
    sources: sourcesVoulues as unknown as string[],
    date_debut: DATE_DEBUT,
    date_fin: `${ANNEE_REFERENCE}-12-31`,
  });

  const indicateurs = data?.indicateurs ?? null;

  // sources distinctes disponibles
  const sourcesDispo = indicateurs
    ? [...new Set(indicateurs.flatMap(i => Object.keys(i.sources)))].map(
        id => ({id, nom: getNomSource(id)})
      )
    : null;
  const sources = sourcesDispo
    ? (sourcesVoulues
        .map(s => sourcesDispo.find(sd => sd.id === s))
        .filter(s => !!s) as Source[])
    : null;

  // détermine si il existe une valeur saisie par la collectivité pour chaque indicateur
  const donneesCompletes =
    // il y a des données
    !!indicateurs?.length &&
    // la liste des identifiants filtrés est complète
    identifiants.filter(identifiant => {
      const indicateur = indicateurs.find(
        ind => ind.definition.identifiant_referentiel === identifiant
      );
      return (
        // l'indicateur existe
        indicateur &&
        // et il y a au moins une valeur renseignée
        !!indicateur.sources[SourceIndicateur.COLLECTIVITE]?.valeurs?.filter(
          v => typeof v.resultat === 'number'
        ).length
      );
    }).length === identifiants.length;

  // prépare les données pour le composant TableauDonnees
  const valeursSecteurs = identifiants?.map(identifiant => {
    const ind = indicateurs?.find(
      i => i.definition.identifiant_referentiel === identifiant
    );
    const indicateur_id = ind?.definition.id;
    return indicateur_id
      ? {
          indicateur_id,
          identifiant,
          valeurs: ind
            ? Object.entries(ind.sources).map(([source, {valeurs}]) => ({
                source,
                valeur: valeurs?.[0].resultat ?? valeurs?.[0].objectif ?? null,
                id: valeurs?.[0].id,
              }))
            : [],
        }
      : undefined;
  });

  return {
    ...rest,
    data: {
      indicateurTrajectoire,
      indicateurs,
      sources,
      valeursSecteurs,
      donneesCompletes,
    },
  };
};
