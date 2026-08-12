import { HistoriqueItem, HistoriqueType } from '@tet/domain/referentiels';

/** Props d'un composant qui ne consomme qu'une variante de l'union. */
export type HistoriqueItemPropsOf<T extends HistoriqueType> = {
  item: Extract<HistoriqueItem, { type: T }>;
};
