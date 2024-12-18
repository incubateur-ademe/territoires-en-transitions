export const countByDateSlotValues = [
  'superior_to_1_year',
  'between_6_month_and_1_year',
  'between_3_month_and_6_month',
  'inferior_to_3_month',
  'since_up_to_3_month',
  'since_between_3_6_month',
  'since_between_6_12_month',
  'since_superior_to_1_year',
] as const;
export type CountByDateSlotKeys = (typeof countByDateSlotValues)[number];

export type CountByDateSlotType = {
  key: CountByDateSlotKeys;
  label: string;
  min_month_duration?: number;
  max_month_duration?: number;
};

export const countByDateSlots: CountByDateSlotType[] = [
  {
    key: 'superior_to_1_year',
    label: "Dans plus d'un an",
    min_month_duration: 12,
  },
  {
    key: 'between_6_month_and_1_year',
    label: 'Entre 6 mois et 1 an',
    min_month_duration: 6,
    max_month_duration: 12,
  },
  {
    key: 'between_3_month_and_6_month',
    label: 'Entre 3 mois et 6 mois',
    min_month_duration: 3,
    max_month_duration: 6,
  },
  {
    key: 'inferior_to_3_month',
    label: 'Dans moins de 3 mois',
    min_month_duration: 0,
    max_month_duration: 3,
  },
  {
    key: 'since_up_to_3_month',
    label: 'Il y a moins de 3 mois',
    min_month_duration: -3,
    max_month_duration: 0,
  },
  {
    key: 'since_between_3_6_month',
    label: 'Il y a entre 3 et 6 mois',
    min_month_duration: -6,
    max_month_duration: -3,
  },
  {
    key: 'since_between_6_12_month',
    label: 'Il y a entre 6 et 12 mois',
    min_month_duration: -12,
    max_month_duration: -6,
  },
  {
    key: 'since_superior_to_1_year',
    label: "Il y a plus d'un an",
    max_month_duration: -12,
  },
] as const;
