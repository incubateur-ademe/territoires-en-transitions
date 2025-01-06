import { Indicateurs } from '@/api';

/** type de données importées */
export type SourceType = 'resultat' | 'objectif';

/** Item dans une liste d'indicateurs (avant que le détail pour la vignette ne soit chargé) */
export type TIndicateurListItem = Indicateurs.domain.IndicateurListItem;

export type TIndicateurPredefini =
  Indicateurs.domain.IndicateurDefinitionPredefini;

export type TIndicateurDefinition = Indicateurs.domain.IndicateurDefinition;
