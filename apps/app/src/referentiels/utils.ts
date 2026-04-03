import { Enums } from '@tet/api';

export const phaseToLabel: Record<Enums<'action_categorie'> | string, string> =
  {
    bases: "S'engager",
    'mise en œuvre': 'Concrétiser',
    effets: 'Consolider',
  };
