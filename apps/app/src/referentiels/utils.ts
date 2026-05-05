import { ActionCategorie } from '@tet/domain/referentiels';

export const categorieToLabel: Record<ActionCategorie | string, string> = {
  bases: "S'engager",
  'mise en œuvre': 'Concrétiser',
  effets: 'Consolider',
};
