import { ProgressionRow } from '../DEPRECATED_scores.types';

// un sous-ensemble des champs pour alimenter notre table des taches
export type TacheDetail = ProgressionRow & { isExpanded: boolean };
