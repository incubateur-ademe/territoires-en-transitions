import { IndicateurListItem } from '@/api/indicateurs/domain';

/** type de données importées */
export type SourceType = 'resultat' | 'objectif';

/** Item dans une liste d'indicateurs (avant que le détail pour la vignette ne soit chargé) */
export type TIndicateurListItem = IndicateurListItem;
