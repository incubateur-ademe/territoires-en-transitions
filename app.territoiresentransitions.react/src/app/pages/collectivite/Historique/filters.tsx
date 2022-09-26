export const NB_ITEMS_PER_PAGE = 10;

export type TFilters = {
  /** filtre par collectivité */
  collectivite_id: number;
  /** par action */
  action_id?: string;
  /** par membres de la collectivité */
  members?: [string];
  /** par plage de dates */
  startDate?: Date;
  endDate?: Date;
  /** index de la page voulue */
  page?: number;
};

export type TSetFilters = (newFilter: TFilters | null) => void;

export const nameToShortNames = {
  members: 'm',
  type: 't',
  startDate: 's',
  endDate: 'e',
  page: 'p',
};
