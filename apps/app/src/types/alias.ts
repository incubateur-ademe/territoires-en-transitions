import { NonNullableFields, Tables, TablesInsert, Views } from '@/api';

export type TAxeRow = Tables<'axe'>;
export type TAxeInsert = TablesInsert<'axe'>;

export type TActionStatutsRow = NonNullableFields<Views<'action_statuts'>>;
