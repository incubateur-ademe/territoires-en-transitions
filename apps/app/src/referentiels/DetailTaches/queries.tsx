import type { ActionDetailed } from '../use-snapshot';

/** Ligne de la table détail des tâches (snapshot action + état déplié) */
export type TacheDetail = ActionDetailed & { isExpanded?: boolean };
