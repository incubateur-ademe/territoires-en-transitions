import { HistoriqueItem, HistoriqueType } from '@tet/domain/referentiels';
import { TFilters } from './filters';

export {
  historiqueTypeEnumValues,
  type HistoriqueActionPrecisionItem,
  type HistoriqueActionStatutItem,
  type HistoriqueItem,
  type HistoriqueJustificationItem,
  type HistoriqueReponseItem,
  type HistoriqueType,
} from '@tet/domain/referentiels';

export type HistoriqueItemProps = {
  item: HistoriqueItem;
};

/** Props d'un composant qui ne consomme qu'une variante de l'union. */
export type HistoriqueItemPropsOf<T extends HistoriqueType> = {
  item: Extract<HistoriqueItem, { type: T }>;
};

export type THistoriqueProps = {
  items: HistoriqueItem[];
  total: number;
  filters: TFilters;
  setFilters: (filters: TFilters | null) => void;
  isLoading?: boolean;
  isError: boolean;
};
