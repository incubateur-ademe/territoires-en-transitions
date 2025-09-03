import {
  ANNEE_REFERENCE,
  DATE_DEBUT,
  getIndicateurTrajectoire,
  getNomSource,
  IndicateurTrajectoireId,
  SEQUESTRATION_CARBONE,
  SourceIndicateur,
} from '../../../../../indicateurs/trajectoires/trajectoire-constants';
import { useIndicateurValeurs } from '../useIndicateurValeurs';
import { TabId, TABS } from './constants';

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
    tabData.filter((d) => !d.isLoading && d.data.donneesCompletes).length ===
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

  const onglet = TABS.find((t) => t.id === id);
  const secteurs =
    onglet && 'secteurs' in onglet
      ? onglet.secteurs
      : indicateurTrajectoire.secteurs;
  const identifiants = secteurs.map((s) => s.identifiant);
  const sourcesVoulues = indicateurTrajectoire.sources;

  const sourceIds = sourcesVoulues as unknown as string[];
  const { data, ...rest } = useIndicateurValeurs({
    identifiantsReferentiel: identifiants,
    sources: sourceIds,
    dateDebut: DATE_DEBUT,
    dateFin: `${ANNEE_REFERENCE}-12-31`,
  });

  // cas particulier : les données ALDO ne sont pas disponibles pour l'année de
  // référence (2015) mais pour l'année 2018
  // TODO: l'agrégation des données de référence devraient être réalisée dans le backend
  const { data: dataAldo } = useIndicateurValeurs({
    disabled: !sourceIds.includes(SourceIndicateur.ALDO),
    identifiantsReferentiel: identifiants,
    sources: [SourceIndicateur.ALDO],
    dateDebut: '2018-01-01',
    dateFin: '2018-12-31',
  });

  const indicateurs = data?.indicateurs ?? [];
  if (dataAldo?.indicateurs?.length && indicateurs.length) {
    // fusionne les données ALDO avec les autres sources
    dataAldo.indicateurs.forEach((indSourceAldo) => {
      if (indSourceAldo.sources[SourceIndicateur.ALDO]) {
        const indicateur = indicateurs.find(
          (ind) => ind.definition.id === indSourceAldo.definition.id
        );
        if (indicateur) {
          indicateur.sources = {
            ...indicateur.sources,
            ...indSourceAldo.sources,
          };
        }
      }
    });
  }

  // sources distinctes disponibles
  const sourcesDispo = [
    ...new Set(indicateurs.flatMap((i) => Object.keys(i.sources))),
  ].map((id) => ({ id, nom: getNomSource(id) }));

  const sources = sourcesVoulues
    .map((s) => sourcesDispo.find((sd) => sd.id === s))
    .filter((s) => !!s) as Source[];

  // détermine si il existe une valeur saisie par la collectivité pour chaque indicateur
  const donneesCompletes =
    // il y a des données
    !!indicateurs?.length &&
    // la liste des identifiants filtrés est complète
    identifiants.filter((identifiant) => {
      const indicateur = indicateurs.find(
        (ind) => ind.definition.identifiantReferentiel === identifiant
      );
      return (
        // l'indicateur existe
        indicateur && // et il y a au moins une valeur renseignée
        !!indicateur.sources[SourceIndicateur.COLLECTIVITE]?.valeurs?.filter(
          (v) => typeof v.resultat === 'number'
        ).length
      );
    }).length === identifiants.length;

  // prépare les données pour le composant TableauDonnees
  const valeursSecteurs = identifiants?.map((identifiant) => {
    const ind = indicateurs?.find(
      (i) => i.definition.identifiantReferentiel === identifiant
    );
    const indicateurId = ind?.definition.id;
    return indicateurId
      ? {
          indicateurId,
          identifiant,
          valeurs: ind
            ? Object.entries(ind.sources).map(([source, { valeurs }]) => ({
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
      secteurs,
      sources,
      valeursSecteurs,
      donneesCompletes,
    },
  };
};
