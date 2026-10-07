import { CategorieAction, LevierId } from '@tet/domain/shared';

export type SelectLevier = (
  levierId: LevierId,
  categorie?: CategorieAction
) => void;
