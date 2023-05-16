import {Database} from 'types/database.types';

export const phaseToLabel: Record<
  Database['public']['Enums']['action_categorie'] | string,
  string
> = {
  bases: "S'engager",
  'mise en œuvre': 'Concrétiser',
  effets: 'Consolider',
};
