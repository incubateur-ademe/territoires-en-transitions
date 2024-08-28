import {
  ANNEE_REFERENCE,
  DATE_DEBUT,
  getNomSource,
  IndicateurTrajectoire,
  SEQUESTRATION_CARBONE,
  SourceIndicateur,
} from '../constants';
import {useIndicateurValeurs} from '../useIndicateurValeurs';

/** Charge les données sectorisées pour le dialogue "Lancer un calcul" */
export const useDonneesSectorisees = (
  indicateur: IndicateurTrajectoire | typeof SEQUESTRATION_CARBONE
) => {
  const {data, ...rest} = useIndicateurValeurs({
    identifiants_referentiel: indicateur.secteurs.map(s => s.identifiant),
    // @ts-ignore
    sources: indicateur.sources,
    date_debut: DATE_DEBUT,
    date_fin: `${ANNEE_REFERENCE}-12-31`,
  });

  const indicateurs = data?.indicateurs ?? null;

  // sources distinctes disponibles
  const sources = indicateurs
    ? [...new Set(indicateurs.flatMap(i => Object.keys(i.sources)))].map(
        id => ({id, nom: getNomSource(id)})
      )
    : null;

  // détermine si il existe une valeur saisie par la collectivité pour chaque indicateur
  const donneesCompletes =
    indicateurs?.filter(
      ind => !!ind.sources[SourceIndicateur.COLLECTIVITE]?.valeurs.length
    )?.length === indicateurs?.length;

  // prépare les données pour le composant TableauDonnees
  const valeursSecteurs = indicateurs?.map(ind => ({
    identifiant: ind.definition.identifiant_referentiel,
    valeurs: Object.entries(ind.sources).map(([source, {valeurs}]) => ({
      source,
      valeur: valeurs?.[0].resultat ?? valeurs?.[0].objectif ?? 0,
    })),
  }));

  return {
    ...rest,
    data: {
      indicateurs,
      sources,
      valeursSecteurs,
      donneesCompletes,
    },
  };
};
