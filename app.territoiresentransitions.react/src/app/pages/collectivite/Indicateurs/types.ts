import {Indicateurs} from '@tet/api';

/** type de données importées */
export type SourceType = 'resultat' | 'objectif';

/** Item dans une liste d'indicateurs (avant que le détail pour la vignette ne soit chargé) */
export type TIndicateurListItem = Indicateurs.domain.IndicateurListItem;

/** Item détaillé pour la vignette graphique dans une liste d'indicateurs */
export type TIndicateurChartInfo = Indicateurs.domain.IndicateurChartInfo;

/** */
export type Indicateur = Pick<
  Indicateurs.domain.IndicateurDefinition,
  'id' | 'titre' | 'description' | 'unite' | 'identifiant' | 'estPerso'
>;

export type IndicateurInsert = Indicateurs.domain.IndicateurDefinitionInsert;

export type TIndicateurPredefiniEnfant = TIndicateurPredefini & {
  parent: string;
};

export type TIndicateurPredefini =
  Indicateurs.domain.IndicateurDefinitionPredefini;

export type TIndicateurPersonnalise =
  Indicateurs.domain.IndicateurDefinitionPersonalise;

export type TIndicateurDefinition = Indicateurs.domain.IndicateurDefinition;
/*
  | TIndicateurPredefini
  | TIndicateurPersonnalise;
*/
